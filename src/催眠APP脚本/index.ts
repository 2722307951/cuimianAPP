// 催眠APP - 每日结算脚本
// 目标：
// 1) 当“系统.当前时段”从“深夜”跨到“凌晨”且“系统.当前日期”未更新时，自动推进日期
// 2) 按跨越天数恢复“系统._催眠能量”（每天恢复“系统._催眠能量上限”的 100%）
// 3) 每天降低“系统.可疑度”10点，降低每个“角色.*.警戒度”10点
// 4) 每个角色每 5 点“警戒度”，每天会增加 1 点“系统.可疑度”

import _ from 'lodash';

const UPDATE_REASON = '催眠APP脚本：每日结算';
const SUBSCRIPTION_SYNC_REASON = '催眠APP脚本：订阅等级同步';
const CHAT_OPTION = { type: 'chat' } as const;

const PATHS = {
  system: '系统',
  roles: '角色',
  date: '系统.当前日期',
  weekday: '系统.星期',
  currentPeriod: '系统.当前时段',
  suspicion: '系统.可疑度',
  mcEnergy: ['系统._催眠能量'],
  mcEnergyMax: ['系统._催眠能量上限'],
} as const;

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const WEEKDAY_CHARS = ['一', '二', '三', '四', '五', '六', '日'] as const;
const PERIOD_SEQUENCE = ['凌晨', '清晨', '早上', '上午', '中午', '下午', '傍晚', '晚上', '深夜'] as const;

function toFiniteNumber(val: unknown, fallback: number | null = null): number | null {
  const n = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function parsePeriodIndex(period: unknown): number | null {
  if (typeof period !== 'string') return null;
  const normalized = period.trim();
  if (!normalized) return null;
  const index = PERIOD_SEQUENCE.indexOf(normalized as (typeof PERIOD_SEQUENCE)[number]);
  return index >= 0 ? index : null;
}

function didCrossDayByPeriod(beforePeriod: unknown, afterPeriod: unknown): boolean {
  const beforeIndex = parsePeriodIndex(beforePeriod);
  const afterIndex = parsePeriodIndex(afterPeriod);
  if (beforeIndex === null || afterIndex === null) return false;
  return afterIndex < beforeIndex;
}

type ParsedDate = {
  year: number | null;
  month: number;
  day: number;
  weekdayIndex: number | null;
  format: 'iso' | 'cn';
};

function computeWeekdayIndex(year: number, month: number, day: number): number | null {
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  return Number.isFinite(weekday) ? ((weekday + 6) % 7) : null;
}

function parseDateText(rawDate: unknown, rawWeekday?: unknown): ParsedDate | null {
  if (typeof rawDate !== 'string') return null;
  const s = rawDate.trim();
  const isoLike = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  const cnLike = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(s);
  const year = isoLike ? Number(isoLike[1]) : null;
  const month = Number(isoLike?.[2] ?? cnLike?.[1]);
  const day = Number(isoLike?.[3] ?? cnLike?.[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;

  const weekdaySource =
    typeof rawWeekday === 'string' && rawWeekday.trim().length > 0 ? rawWeekday.trim() : typeof rawDate === 'string' ? rawDate : '';
  const weekdayMatch = /(星期|周)\s*([一二三四五六日天])/.exec(weekdaySource);
  const weekdayChar = weekdayMatch ? weekdayMatch[2] : null;
  const normalized = weekdayChar === '天' ? '日' : weekdayChar;
  const explicitWeekdayIndex = normalized ? WEEKDAY_CHARS.indexOf(normalized as any) : -1;
  const derivedWeekdayIndex =
    explicitWeekdayIndex >= 0
      ? explicitWeekdayIndex
      : year !== null && Number.isFinite(year)
        ? computeWeekdayIndex(year, month, day)
        : null;

  return {
    year: year !== null && Number.isFinite(year) ? year : null,
    month: clampNumber(month, 1, 12),
    day: clampNumber(day, 1, MONTH_DAYS[clampNumber(month, 1, 12) - 1]),
    weekdayIndex: derivedWeekdayIndex,
    format: isoLike ? 'iso' : 'cn',
  };
}

function toDayOfYear(d: ParsedDate): number {
  if (d.year !== null) {
    return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / (24 * 60 * 60 * 1000));
  }
  const mIndex = clampNumber(d.month, 1, 12) - 1;
  const dIndex = clampNumber(d.day, 1, MONTH_DAYS[mIndex]) - 1;
  const prefix = MONTH_DAYS.slice(0, mIndex).reduce((a, b) => a + b, 0);
  return prefix + dIndex;
}

function addDays(d: ParsedDate, deltaDays: number): ParsedDate {
  if (d.year !== null) {
    const date = new Date(Date.UTC(d.year, d.month - 1, d.day));
    date.setUTCDate(date.getUTCDate() + Math.max(0, Math.floor(deltaDays)));
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      weekdayIndex: computeWeekdayIndex(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()),
      format: d.format,
    };
  }

  let month = clampNumber(d.month, 1, 12);
  let day = clampNumber(d.day, 1, MONTH_DAYS[month - 1]);
  let weekdayIndex = d.weekdayIndex;

  let remaining = Math.max(0, Math.floor(deltaDays));
  while (remaining > 0) {
    day += 1;
    if (day > MONTH_DAYS[month - 1]) {
      day = 1;
      month += 1;
      if (month > 12) month = 1;
    }
    if (weekdayIndex !== null) weekdayIndex = (weekdayIndex + 1) % WEEKDAY_CHARS.length;
    remaining -= 1;
  }

  return { year: null, month, day, weekdayIndex, format: d.format };
}

function formatDateText(d: ParsedDate): string {
  if (d.format === 'iso' && d.year !== null) {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }
  return `${d.month}月${d.day}日`;
}

function formatWeekdayText(d: ParsedDate): string | null {
  if (d.weekdayIndex === null) return null;
  const weekdayChar = WEEKDAY_CHARS[clampNumber(d.weekdayIndex, 0, WEEKDAY_CHARS.length - 1)];
  return `星期${weekdayChar}`;
}

function getMessageVariableOption(): VariableOption {
  try {
    return { type: 'message', message_id: getCurrentMessageId() };
  } catch {
    return { type: 'message', message_id: 'latest' };
  }
}

type ChatSubscriptionSnapshot = {
  tierValue: number | null;
  store: Record<string, any> | null;
  money: number | null;
};

function readChatSubscriptionSnapshot(): ChatSubscriptionSnapshot | null {
  try {
    const vars = getVariables(CHAT_OPTION) as Record<string, any> | null | undefined;
    const system = _.isPlainObject(vars?.系统) ? (vars?.系统 as Record<string, any>) : {};
    const protagonist = _.isPlainObject(vars?.主角) ? (vars?.主角 as Record<string, any>) : {};
    const tierRaw = toFiniteNumber(system._催眠APP等级, null);
    const tierValue = tierRaw === null ? null : Math.max(1, Math.floor(tierRaw));
    const store = _.isPlainObject(system._hypnoos) ? (_.cloneDeep(system._hypnoos) as Record<string, any>) : null;
    const money = toFiniteNumber(protagonist.金钱, null);
    return { tierValue, store, money };
  } catch (err) {
    console.warn('[催眠APP脚本] 读取聊天订阅状态失败', err);
    return null;
  }
}

async function setIfChanged(
  mvu: Mvu.MvuData,
  path: string,
  nextValue: unknown,
  reason = UPDATE_REASON,
): Promise<boolean> {
  const prevStat = _.get(mvu.stat_data, path);
  const prevDisplay = _.get(mvu.display_data, path);
  if (_.isEqual(prevStat, nextValue) && _.isEqual(prevDisplay, nextValue)) return false;

  const setter = (Mvu as any).setMvuVariable as
    | ((mvuData: Mvu.MvuData, variablePath: string, value: unknown, options?: { reason?: string }) => Promise<boolean>)
    | undefined;

  if (typeof setter === 'function') {
    const ok = await setter(mvu, path, nextValue, { reason });
    if (ok) {
      _.set(mvu.stat_data, path, nextValue);
      _.set((mvu as any).display_data ?? ((mvu as any).display_data = {}), path, nextValue);
    }
    return ok;
  }

  _.set(mvu.stat_data, path, nextValue);
  _.set((mvu as any).display_data ?? ((mvu as any).display_data = {}), path, nextValue);
  return true;
}

function pickExistingPath(statData: Record<string, any>, paths: readonly string[]): string {
  for (const p of paths) {
    if (_.has(statData, p)) return p;
  }
  return paths[0];
}

function resolveDayDelta(
  beforeDate: unknown,
  afterDate: unknown,
  beforeWeekday: unknown,
  afterWeekday: unknown,
  beforePeriod: unknown,
  afterPeriod: unknown,
): { dayDelta: number; isDateMissingUpdate: boolean; nextDateText?: string } {
  const beforeParsed = parseDateText(beforeDate, beforeWeekday);
  const afterParsed = parseDateText(afterDate, afterWeekday);
  const periodCrossed = didCrossDayByPeriod(beforePeriod, afterPeriod);

  if (!beforeParsed || !afterParsed) {
    const unchanged = typeof beforeDate === 'string' && typeof afterDate === 'string' && beforeDate === afterDate;
    const isDateMissingUpdate = unchanged && periodCrossed;
    return { dayDelta: isDateMissingUpdate ? 1 : 0, isDateMissingUpdate };
  }

  const beforeDay = toDayOfYear(beforeParsed);
  const afterDay = toDayOfYear(afterParsed);
  let delta = afterDay - beforeDay;
  if (delta < 0) delta += 365; // 允许跨年（简单按 365 天处理）

  const isSameDay = delta === 0;
  const isDateMissingUpdate = isSameDay && periodCrossed;
  if (!isDateMissingUpdate) return { dayDelta: Math.max(0, Math.floor(delta)), isDateMissingUpdate: false };

  const nextDate = addDays(afterParsed, 1);
  return { dayDelta: 1, isDateMissingUpdate: true, nextDateText: formatDateText(nextDate) };
}

async function applyDailySettlement(mvu: Mvu.MvuData, before: Mvu.MvuData): Promise<boolean> {
  const statAfter = mvu.stat_data ?? {};
  const statBefore = before?.stat_data ?? {};

  const beforeDate = _.get(statBefore, PATHS.date);
  const afterDate = _.get(statAfter, PATHS.date);
  const beforeWeekday = _.get(statBefore, PATHS.weekday);
  const afterWeekday = _.get(statAfter, PATHS.weekday);
  const beforePeriod = _.get(statBefore, PATHS.currentPeriod);
  const afterPeriod = _.get(statAfter, PATHS.currentPeriod);

  const { dayDelta, isDateMissingUpdate, nextDateText } = resolveDayDelta(
    beforeDate,
    afterDate,
    beforeWeekday,
    afterWeekday,
    beforePeriod,
    afterPeriod,
  );
  if (dayDelta <= 0 && !isDateMissingUpdate) return false;

  let changed = false;

  if (isDateMissingUpdate && typeof nextDateText === 'string') {
    if (await setIfChanged(mvu, PATHS.date, nextDateText)) changed = true;
    const afterParsed = parseDateText(afterDate, afterWeekday);
    if (afterParsed) {
      const nextDate = addDays(afterParsed, 1);
      const nextWeekday = formatWeekdayText(nextDate);
      if (_.has(statAfter, PATHS.weekday) && nextWeekday !== null) {
        if (await setIfChanged(mvu, PATHS.weekday, nextWeekday)) changed = true;
      }
    }
  }

  const energyPath = pickExistingPath(statAfter, PATHS.mcEnergy);
  const energyMaxPath = pickExistingPath(statAfter, PATHS.mcEnergyMax);
  const energy = toFiniteNumber(_.get(statAfter, energyPath), 0) ?? 0;
  const energyMax = toFiniteNumber(_.get(statAfter, energyMaxPath), null);

  if (energyMax !== null) {
    const safeMax = Math.max(0, energyMax);
    const regenPerDay = safeMax;
    const nextEnergy = clampNumber(energy + regenPerDay * dayDelta, 0, safeMax);
    if (await setIfChanged(mvu, energyPath, nextEnergy)) changed = true;
    // 若别名字段也存在，保持一致
    for (const aliasPath of [...PATHS.mcEnergy, ...PATHS.mcEnergyMax]) {
      if (!_.has(statAfter, aliasPath)) continue;
      if (aliasPath === energyPath || aliasPath === energyMaxPath) continue;
      const aliasValue = aliasPath.includes('能量上限') ? safeMax : nextEnergy;
      if (await setIfChanged(mvu, aliasPath, aliasValue)) changed = true;
    }
  }

  const suspicion = toFiniteNumber(_.get(statAfter, PATHS.suspicion), null);
  const roles = _.get(statAfter, PATHS.roles);
  let dailySuspicionIncrease = 0;
  if (_.isPlainObject(roles)) {
    for (const [roleName, roleValue] of Object.entries<any>(roles)) {
      if (!roleName) continue;
      if (!_.isPlainObject(roleValue)) continue;
      const alertnessPath = `${PATHS.roles}.${roleName}.警戒度`;
      const alertness = toFiniteNumber(_.get(statAfter, alertnessPath), null);
      if (alertness === null) continue;

      // 警戒度影响可疑度：每 5 点警戒度每天 +1 可疑度（按天结算，警戒度每天还会自然下降）
      for (let i = 0; i < dayDelta; i += 1) {
        const alertnessAtStart = Math.max(0, alertness - 10 * i);
        dailySuspicionIncrease += Math.floor(alertnessAtStart / 5);
      }

      const nextAlertness = Math.max(0, alertness - 10 * dayDelta);
      if (await setIfChanged(mvu, alertnessPath, nextAlertness)) changed = true;
    }
  }

  if (suspicion !== null) {
    const nextSuspicion = Math.max(0, suspicion - 10 * dayDelta + dailySuspicionIncrease);
    if (await setIfChanged(mvu, PATHS.suspicion, nextSuspicion)) changed = true;
  }

  return changed;
}

async function applySubscriptionSync(mvu: Mvu.MvuData): Promise<boolean> {
  const snapshot = readChatSubscriptionSnapshot();
  if (!snapshot) return false;

  let changed = false;

  if (snapshot.store && (await setIfChanged(mvu, '系统._hypnoos', snapshot.store, SUBSCRIPTION_SYNC_REASON))) {
    changed = true;
  }

  if (snapshot.money !== null && (await setIfChanged(mvu, '主角.金钱', snapshot.money, SUBSCRIPTION_SYNC_REASON))) {
    changed = true;
  }

  if (snapshot.tierValue !== null) {
    // 订阅等级改为直接改 after.stat_data，再整份 replace。
    // 当前现象说明消息楼层里“金钱”路径可被 setter 正常更新，但“系统._催眠APP等级”可能因字段未预声明或类型限制被拒绝。
    // 这里按参考脚本的思路直接改事件里的 after，再交给 replaceMvuData 落盘。
    if (!_.isEqual(_.get(mvu.stat_data, '系统._催眠APP等级'), snapshot.tierValue)) {
      _.set(mvu.stat_data, '系统._催眠APP等级', snapshot.tierValue);
      _.set((mvu as any).display_data ?? ((mvu as any).display_data = {}), '系统._催眠APP等级', snapshot.tierValue);
      changed = true;
    }

    const legacyTierPath = '系统._催眠APP订阅等级';
    if (_.has(mvu.stat_data, legacyTierPath)) {
      const legacyTierLabel = `VIP${snapshot.tierValue}`;
      if (!_.isEqual(_.get(mvu.stat_data, legacyTierPath), legacyTierLabel)) {
        _.set(mvu.stat_data, legacyTierPath, legacyTierLabel);
        _.set((mvu as any).display_data ?? ((mvu as any).display_data = {}), legacyTierPath, legacyTierLabel);
        changed = true;
      }
    }
  }

  return changed;
}

$(() => {
  (async () => {
    try {
      await waitGlobalInitialized('Mvu');
    } catch (err) {
      console.warn('[催眠APP脚本] Mvu 未就绪，脚本不生效', err);
      return;
    }

    let isSelfApplying = false;

    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async (after: Mvu.MvuData, before: Mvu.MvuData) => {
      if (isSelfApplying) {
        isSelfApplying = false;
        return;
      }

      try {
        let changed = false;

        if (await applyDailySettlement(after, before)) {
          changed = true;
        }

        if (await applySubscriptionSync(after)) {
          changed = true;
        }

        if (!changed) return;

        isSelfApplying = true;
        await Mvu.replaceMvuData(after, getMessageVariableOption());
      } catch (err) {
        console.error('[催眠APP脚本] 每日结算失败', err);
        isSelfApplying = false;
      }
    });
  })();
});
