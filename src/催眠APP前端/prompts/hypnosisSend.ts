import type { HypnosisFeature } from '../types';

function normalizeText(text: string | undefined): string {
  return (text ?? '').replaceAll('\r\n', '\n').trimEnd();
}

function indentLines(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return normalizeText(text)
    .split('\n')
    .map(line => (line.length ? `${pad}${line}` : pad))
    .join('\n');
}

export function buildHypnosisSendMessage({
  features,
  durationMinutes,
  globalNote,
}: {
  features: HypnosisFeature[];
  durationMinutes: number;
  globalNote: string;
}): string {
  const selected = features.filter(f => f.isEnabled);
  const names = selected.map(f => f.title).filter(Boolean);

  const getNumericLabel = (f: HypnosisFeature): string | null => {
    switch (f.id) {
      case 'vip1_memory_erase':
        return '记忆消除时长（分钟）';
      default:
        return null;
    }
  };

  const lines: string[] = [];
  lines.push('<催眠发送>');
  lines.push(`开启的功能名列表: ${names.length ? names.join('、') : ''}`);
  lines.push('本次的催眠效果:');

  for (const f of selected) {
    lines.push(`  ${f.title}:`);
    lines.push('    描述:');
    lines.push(indentLines(f.description ?? '', 6));

    const numericLabel = getNumericLabel(f);
    if (numericLabel && typeof f.userNumber === 'number' && Number.isFinite(f.userNumber)) {
      lines.push(`    ${numericLabel}: ${f.userNumber}`);
    }

    if (
      f.id === 'trial_basic' ||
      f.id === 'vip1_desire_echo' ||
      f.id === 'vip1_forced_lewd_language' ||
      f.id === 'vip1_senses' ||
      f.id === 'vip1_temp_sensitivity' ||
      f.id === 'vip1_truth_serum' ||
      f.id === 'vip1_memory_erase' ||
      f.id === 'vip1_estrus' ||
      f.id === 'vip2_medium' ||
      f.id === 'vip2_ghost_hand' ||
      f.id === 'vip2_body_lock' ||
      f.id === 'vip2_vision_steal' ||
      f.id === 'vip2_vision_share' ||
      f.id === 'vip2_pain_to_pleasure' ||
      f.id === 'vip2_emperors_new_clothes' ||
      f.id === 'vip2_new_emperor' ||
      f.id === 'vip3_true_love' ||
      f.id === 'vip3_avenger' ||
      f.id === 'vip3_forced' ||
      f.id === 'vip3_orgasm_ban' ||
      f.id === 'vip3_visual_filter' ||
      f.id === 'vip3_conditioned_reflex' ||
      f.id === 'vip3_temp_common_sense' ||
      f.id === 'vip3_shame_invert' ||
      f.id === 'vip3_temp_false_memory' ||
      f.id === 'vip3_pseudo_time_stop' ||
      f.id === 'vip4_advanced' ||
      f.id === 'vip4_excretion_control' ||
      f.id === 'vip4_closed_space_common_sense' ||
      f.id === 'vip4_fetish_implant' ||
      f.id === 'vip4_fetish_aversion' ||
      f.id === 'vip4_control_body_keep_conscious' ||
      f.id === 'vip4_control_body_no_conscious' ||
      f.id === 'vip4_cognitive_block' ||
      f.id === 'vip4_temp_personality' ||
      f.id === 'vip4_sensation_graft' ||
      f.id === 'vip4_breast_remodeling' ||
      f.id === 'vip4_genital_remodeling' ||
      f.id === 'vip4_race_remodeling' ||
      f.id === 'vip4_butt_remodeling' ||
      f.id === 'vip4_urethra_remodeling' ||
      f.id === 'vip4_exclusive_access' ||
      f.id === 'vip4_lewd_mark' ||
      f.id === 'vip4_masturbation_punishment' ||
      f.id === 'vip5_ability_erotic' ||
      f.id === 'vip5_moral_reform' ||
      f.id === 'vip5_permanent' ||
      f.id === 'vip5_permanent_false_memory' ||
      f.id === 'vip5_permanent_personality' ||
      f.id === 'vip5_personality_kill' ||
      f.id === 'vip5_condom_transform' ||
      f.id === 'vip5_forced_insertion' ||
      f.id === 'vip5_fleshlight' ||
      f.id === 'vip5_true_time_stop' ||
      f.id === 'vip2_pleasure'
    ) {
      if (f.id === 'vip1_memory_erase') {
        lines.push('    持续轮次: 1');
      } else if (
        f.id === 'vip3_conditioned_reflex' ||
        f.id === 'vip4_breast_remodeling' ||
        f.id === 'vip4_genital_remodeling' ||
        f.id === 'vip4_race_remodeling' ||
        f.id === 'vip4_butt_remodeling' ||
        f.id === 'vip4_urethra_remodeling' ||
        f.id === 'vip4_exclusive_access' ||
        f.id === 'vip4_lewd_mark' ||
        f.id === 'vip4_closed_space_common_sense' ||
        f.id === 'vip4_fetish_implant' ||
        f.id === 'vip4_fetish_aversion' ||
        f.id === 'vip4_masturbation_punishment' ||
        f.id === 'vip5_ability_erotic' ||
        f.id === 'vip5_moral_reform' ||
        f.id === 'vip5_permanent' ||
        f.id === 'vip5_permanent_false_memory' ||
        f.id === 'vip5_permanent_personality' ||
        f.id === 'vip5_personality_kill'
      ) {
        lines.push('    持续轮次: 永久');
      } else if (typeof f.userRounds === 'number' && Number.isFinite(f.userRounds)) {
        lines.push(`    持续轮次: ${f.userRounds}`);
      }
      if (
        f.userMode &&
        f.id !== 'trial_basic' &&
        f.id !== 'vip1_desire_echo' &&
        f.id !== 'vip1_forced_lewd_language' &&
        f.id !== 'vip1_senses' &&
        f.id !== 'vip1_temp_sensitivity' &&
        f.id !== 'vip1_truth_serum' &&
        f.id !== 'vip1_memory_erase' &&
        f.id !== 'vip2_vision_steal' &&
        f.id !== 'vip2_vision_share' &&
        f.id !== 'vip3_visual_filter' &&
        f.id !== 'vip1_estrus' &&
        f.id !== 'vip2_medium' &&
        f.id !== 'vip2_pleasure' &&
        f.id !== 'vip2_pain_to_pleasure' &&
        f.id !== 'vip2_emperors_new_clothes' &&
        f.id !== 'vip2_new_emperor' &&
        f.id !== 'vip3_shame_invert' &&
        f.id !== 'vip3_temp_common_sense' &&
        f.id !== 'vip3_temp_false_memory' &&
        f.id !== 'vip2_ghost_hand' &&
        f.id !== 'vip2_body_lock' &&
        f.id !== 'vip4_control_body_keep_conscious' &&
        f.id !== 'vip4_control_body_no_conscious' &&
        f.id !== 'vip3_true_love' &&
        f.id !== 'vip3_avenger' &&
        f.id !== 'vip3_forced' &&
        f.id !== 'vip4_temp_personality' &&
        f.id !== 'vip4_advanced' &&
        f.id !== 'vip3_orgasm_ban' &&
        f.id !== 'vip4_excretion_control' &&
        f.id !== 'vip4_cognitive_block' &&
        f.id !== 'vip4_sensation_graft' &&
        f.id !== 'vip5_forced_insertion' &&
        f.id !== 'vip3_pseudo_time_stop' &&
        f.id !== 'vip4_closed_space_common_sense' &&
        f.id !== 'vip4_masturbation_punishment' &&
        f.id !== 'vip3_conditioned_reflex' &&
        f.id !== 'vip4_fetish_implant' &&
        f.id !== 'vip4_fetish_aversion' &&
        f.id !== 'vip4_breast_remodeling' &&
        f.id !== 'vip4_genital_remodeling' &&
        f.id !== 'vip4_butt_remodeling' &&
        f.id !== 'vip4_urethra_remodeling' &&
        f.id !== 'vip4_lewd_mark' &&
        f.id !== 'vip4_exclusive_access' &&
        f.id !== 'vip5_ability_erotic' &&
        f.id !== 'vip5_true_time_stop' &&
        f.id !== 'vip5_condom_transform' &&
        f.id !== 'vip5_fleshlight' &&
        f.id !== 'vip5_permanent' &&
        f.id !== 'vip5_permanent_false_memory' &&
        f.id !== 'vip5_moral_reform' &&
        f.id !== 'vip5_permanent_personality' &&
        f.id !== 'vip5_personality_kill' &&
        f.id !== 'vip4_race_remodeling'
      ) {
        const targetName =
          f.id === 'vip4_closed_space_common_sense'
            ? '当前房间所有人'
            : f.userTarget && f.userTarget.trim()
              ? f.userTarget
              : '{{选择的角色名称}}';
        const modeDescriptions: Record<string, string> = {
          视觉: `需要让${targetName}看向手机屏幕三秒`,
          触觉: `需要触摸${targetName}三秒`,
          听觉: `需要让${targetName}持续听{{User}}说话三秒,说话内容随意`,
        };
        lines.push(`    催眠模式: ${f.userMode}-${modeDescriptions[f.userMode] ?? ''}`);
      }
      if (f.id === 'trial_basic') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 让${targetName}陷入短暂的意识空白，服从并做出符合备注中催眠指令的简单举动。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法迫使${targetName}执行会引起其情绪剧烈波动、带有严重羞耻感或违背生存常识的指令。一旦指令越界，催眠状态将立刻中断。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}目光略微呆滞、身体自然放松、动作略显机械的细节。清醒后对刚才的举动会感到轻微的困惑，但不会立刻警觉。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_desire_echo') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 必须截取${targetName}当前正在思考的，或是潜意识里极力掩饰的与性相关的下流想法、性癖及性幻想，并直接在{{User}}的脑海中以声音形式播放。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] {{User}}只能被动聆听，无法通过此功能直接篡改${targetName}的想法。不能探听与色情/欲望无关的正常记忆与情报。`,
        );
        lines.push(
          `    催眠表现: [感官描写] {{User}}耳边会清晰响起${targetName}内心的娇喘与下流想法；若${targetName}当前完全没有这种想法，则只能听到普通的内心独白。${targetName}对此探听过程毫无察觉。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_forced_lewd_language') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 必须将${targetName}打算说出的正常语言，自动替换成极度下贱、充满性暗示的淫言秽语，且语气不受控制地带有娇喘。淫语风格必须契合${targetName}的原有身份与人设。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法强迫${targetName}开口张嘴。如果${targetName}发现异常，可以凭借意志力死死紧闭嘴巴保持沉默；此功能无法获取目标的真实想法。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}尝试开口时喉咙发热的细节；脱口而出的瞬间，正常词汇变成淫荡句子后，${targetName}脸上会浮现出极度羞耻、震惊与难以置信的表情。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_senses') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 单纯篡改味觉与嗅觉神经信号，将${targetName}感知到的某种特定味道强制替换为备注中指定的味道，并让这种错位感知稳定生效。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法改变${targetName}对事物本质的认知，也无法强迫其吞咽。即便感官被改写，${targetName}依然可能因心理抗拒而拒绝接触或食用该物品。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}在勉强摄入时神情的明显反差：心理上带着屈辱与抗拒，但味蕾和鼻腔却不受控制地感受到诱人的滋味，舌尖甚至会下意识追逐这种错位快感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_temp_sensitivity') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        const sensitivityOp = f.userSensitivityOp ?? '增加';
        const sensitivityPart = f.userSensitivityPart ?? '阴部';
        const sensitivityValue = typeof f.userNumber === 'number' && Number.isFinite(f.userNumber) ? f.userNumber : 1;
        lines.push(`    敏感度调整: ${sensitivityOp}${sensitivityValue}`);
        lines.push(`    目标部位: ${sensitivityPart}`);
        lines.push(
          `    该催眠能做什么: [强制执行] 临时提高或压低${targetName}指定部位的敏感度，让身体反馈在短时间内出现明显的亢奋或迟钝变化。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 只能调整敏感度数值本身，无法直接改写${targetName}的情绪、欲望与认知，也不能永久固定这种变化（时间结束后回落）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}被调整的部位短暂泛起不自然的红晕、微微抽搐或充血的生理细节。${targetName}会对自己身体的突然变化感到不适或难耐。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_truth_serum') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强制封锁语言中枢里的掩饰能力。只要${targetName}开口回应，就只能吐露客观事实，以及内心最真实的欲望、秘密与羞耻念头。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法剥夺${targetName}的清醒意识，也不能强迫其张嘴。若问题过于羞耻，${targetName}仍可凭理智死死咬住牙关保持沉默，拒绝回答。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}极度纠结与难堪、脸色迅速涨红的细节。一旦试图撒谎，喉咙便会发紧发涩难以出声；只有放弃抵抗说出真话后，声音才会艰难但顺畅地吐露出来。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_memory_erase') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 物理裁切当前记忆链，只要命中备注中的内容，${targetName}将难以正常提取、复述或还原那段经历。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 这不是彻底抹杀人格的永久删除，${targetName}仍保留基本理智。在受到强烈后续刺激或联想时，存在重新回忆起该片段的可能。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 当话题触及被裁切内容时，描写${targetName}出现短暂的思维断层与迟滞，眼神茫然、停顿，或对细节出现明显的认知空白。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip1_estrus') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 必须让${targetName}的敏感度被持续放大，私处不受控制地分泌爱液，并伴随强烈的空虚与被填满的渴望。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法彻底剥夺${targetName}的理智与判断能力。${targetName}依然知道自己身处何地，也仍可凭借强烈意志压制身体冲动，拒绝主动做出求欢举动。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}身体突然一颤、脸上迅速浮起不自然潮红的细节。描写她本能地夹紧双腿、按住小腹试图隐藏失控反应，呼吸紊乱，眼神在本能渴求与拼命维持的自尊之间来回撕扯。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_medium') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 使${targetName}在保持清醒的前提下，执行平时会抗拒、犹豫，甚至带有轻度羞耻感的指令，身体会自然配合并顺从完成。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法逼迫${targetName}执行严重自毁、极端违背底线或会造成重大物理伤害的行为。若遭遇生死危机，催眠立刻失效。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}眼神逐渐失去高光、瞳孔轻微放大的细节。神情中需残留短促的挣扎与迷茫，但动作整体连贯顺从，呼吸节奏明显加快。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_ghost_hand') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 必须让幽灵手在${targetName}体表或体内制造极其真实的触感，无视衣物阻隔，对胸部、私处或更深处持续施加备注中要求的揉捏、抽插或抠挖刺激。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 幽灵手没有物理质量，旁人既看不见也碰不到。因此，任何人（包括${targetName}自己）都无法通过物理手段（如用手阻挡）去阻止幽灵手的侵犯。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}在毫无预兆时突然潮红、腿软，并本能地试图去阻挡身边根本不存在的触碰的细节；在旁人眼里，她像是在对着空气失控扭动与喘息。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_body_lock') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 瞬间剥夺主动控制权。不论${targetName}原本在做什么，都会被硬生生定格在当前姿势，同时必须保留其完整的触觉、听觉、痛觉与快感感知。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法改写思想认知。${targetName}内心的恐惧、羞耻依然存在；无法抹除出汗、流泪、分泌体液等非自主生理反应。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}身体突兀地僵死在原地，维持着不合常理的姿势，但眼球仍在惊恐转动的细节。呼吸被压到极低极浅，整个人像被硬化成一具清醒的雕塑。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_vision_steal') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 持续劫持视觉与听觉信号，让{{User}}实时经历对方当前所见所闻，全程无视物理空间距离限制。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 只能进行被动的"看"与"听"，无法操控${targetName}的视线方向或注意力焦点。如果对方闭眼或处于完全黑暗中，{{User}}也只能看见漆黑。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 连接建立瞬间，{{User}}眼前的画面会快速闪烁一次，随后完全切换为${targetName}的视角。${targetName}本人对此毫无察觉，一切照常进行。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_vision_share') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 将{{User}}当前所见画面与所闻声音，强制叠加投影到${targetName}的视觉与听觉中枢，让其亲历{{User}}正在经历的一切。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 只能单向输出，无法反向获取${targetName}的信号。${targetName}的原有视听能力仍然保留，共享信号是叠加态，会令其产生感官混淆。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}突然眼神涣散、微微偏头的细节，像是在专注观看或聆听来自远方的幻象，偶尔会下意识地虚空划动手指，试图触碰眼前的幻景。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_pain_to_pleasure') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 将催眠期间${targetName}身体收到的一切疼痛刺激，强制转换为强烈的快感信号。原本痛苦的击打或刺伤，必须引发不受控制的娇喘与愉悦。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 不会降低痛觉的物理触发阈值，无法阻止物理伤害造成的组织损伤、流血或骨折。${targetName}依然会受伤，只是感受不到痛，只体验到爽。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}在受击后短暂错愕，随后神情涣散、脸颊泛红的细节。呼吸变得急促沉重，身体不受控制地微微发抖，被击打部位反而传递出异常的酥麻与热意。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_emperors_new_clothes') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 在视觉与触觉皮层中强行植入虚拟衣物信号。全裸的${targetName}在镜子前或他人注视下坚信自己穿着衣物，完全不会产生暴露感与羞耻心。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法改变旁观者眼中一丝不挂的物理事实；虚拟衣物不具备保暖或防护作用，无法在寒冷中提供遮蔽。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}以完全自然的姿态裸体行走、交谈，神情与肢体毫无违和感。只有当面对照片铁证或被旁人反复直接提醒时，才会陷入混乱的自我怀疑。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_new_emperor') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强行关闭对穿戴状态的感知通路。让明明穿着衣物的${targetName}深信自己正一丝不挂地暴露于众人面前，低头查看也会产生"赤身裸体"的强迫错觉。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法真正脱去现实中的衣物。周围人眼中的${targetName}仍然是正常穿着状态，不会因为她的恐慌而看见任何裸露。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}满脸通红地用手臂死死遮挡胸口或下腹的细节。姿态极其慌乱羞耻，不停拉扯、摸索自己"已经不存在"的衣物；旁人的困惑目光反而会加剧她的被迫害妄想。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_true_love') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 持续植入极端正面滤镜，强迫${targetName}不自觉地美化{{User}}的任何举止（原本反感的举动必须被重新解读为善意、幽默与魅力）。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法迫使${targetName}跨越其绝对的核心人格底线（如立刻杀人）。但催眠结束后，这段被美化过的情感记忆绝对不会自动消失。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}看向{{User}}的眼神逐渐变得柔软湿润，脸颊不受控制地泛起微红，言语间充满毫无保留的信任与迷恋。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_avenger') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 在${targetName}潜意识中植入针对备注中指定对象的极端负面滤镜，将对方的哪怕是善意举动，也强行解读为阴谋、嘲讽或攻击。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法直接赋予${targetName}超越自身能力的破坏力。催眠结束后，这段被扭曲过的仇恨记忆绝对不会自动消失。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}看向被指定对象时，目光逐渐变得冰冷、警惕且带有强烈敌意的细节，肢体语言呈现出极强的攻击性与排斥感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_forced') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        const count = typeof f.userNumber === 'number' && Number.isFinite(f.userNumber) ? f.userNumber : 1;
        lines.push(`    强制高潮次数: ${count}`);
        lines.push(
          `    该催眠能做什么: [强制执行] 无条件突破理智防线，在指定次数内，每一次高潮都必须真实、剧烈地发生，绝对不可抗拒。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 强制高潮无法令${targetName}对{{User}}产生真实的好感或爱意。高潮结束后，${targetName}反而会留下强烈的羞耻感与被侵犯感。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}身体不受控制地绷紧弓起、随后剧烈颤抖、呼吸彻底凌乱的生理反应；喉咙里泄出压抑不住的尖锐叫声，体液大量喷涌。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_orgasm_ban') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 彻底掐断高潮释放的最后通路。${targetName}会在极致的快感中无限逼近顶点，但永远无法宣泄，只能在持续的极度煎熬中积累快感压力。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 只能封锁"高潮释放"这一环节，无法阻止快感的产生与累积。`);
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}在即将登顶的瞬间全身剧烈痉挛、崩溃哭喊却无法释放的绝望感。当封锁解除时，必须描写累积的快感压力一次性暴涌而出的极致失神状态。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_visual_filter') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 在${targetName}视觉皮层中强行植入滤镜，使其在看着{{User}}时，认定眼前的人是备注中指定的对象。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 仅修改${targetName}的视觉认知，无法改变{{User}}真实的物理外观、身高体重与声音。若声音或触感差异过大，可能引发认知冲突。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}毫无违和感地与{{User}}交谈互动，眼神中流露出对"被替换者"应有的情感（如亲昵或敬畏），嘴里却喊着另一个人的名字的诡异反差。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_conditioned_reflex') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 一旦备注中的触发条件被满足，${targetName}必须不由自主地、毫无延迟地执行预设的反射行为，理智反抗绝对无效。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法植入会导致自残、死亡或严重违背生物求生本能的条件反射。`);
        lines.push(
          `    催眠表现: [感官描写] 必须描写触发条件满足瞬间，${targetName}眼神短暂失焦、身体不受控制地开始执行预设动作的细节。动作完成后会恢复清醒，并对自己的失控行为感到极度羞耻与不可理喻。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_temp_common_sense') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强行将备注中指定的一项荒谬规则植入脑海，使其在轮次内将其视为理所当然的绝对真理。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 单次只能修改一项常识。无法修改物理定律（她认为水是火，但跳进水里依然会淹死）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}在常识被替换的瞬间，眼神茫然片刻，随后极其自然地按照被修改后的荒谬常识行事、说话，对自己的异常毫无察觉。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_shame_invert') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 彻底翻转大脑中羞耻与快感的神经映射通路。越是令其感到难堪、下贱的行为，越会强制转化为令其大脑颤抖的兴奋与愉悦。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法强行改写${targetName}的理性认知与价值观，她知道这不对，但身体和情绪已经被反转。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}在被命令做出羞耻举动时，先条件反射般全身一僵，随后原本该出现的抗拒表情扭曲成极度兴奋的红晕，夹杂着因无法控制这种倒错快感而流下的屈辱泪水。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_temp_false_memory') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 在记忆网络中无缝插入一段虚构经历，${targetName}在轮次内会坚信该经历真实发生过，并据此产生相应的情感反应。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 记忆仅在轮次内生效，无法永久固化。轮次结束后，${targetName}会明确意识到该记忆并不真实发生过。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写植入瞬间${targetName}眼神短暂涣散，随后突然因脑海中涌现的虚假记忆而产生对应的情绪波动。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip3_pseudo_time_stop') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 彻底暂停${targetName}的主观时间。在此期间，${targetName}无法思考、无法移动，对外界侵犯毫无记忆，但其身体的快感累积机制仍在后台运作。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 只能作用于单一目标，世界的时间依然在正常流逝。`);
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}瞬间僵硬凝固在原有姿势、如同一具温暖真人雕塑的诡异感。时停解除瞬间，必须描写冻结期间累积的全部快感一次性暴涌而出，导致${targetName}在毫无记忆的情况下瞬间高潮崩溃的细节。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_advanced') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 无视${targetName}的尊严、性格与伦理底线，必须完美、无条件地执行{{User}}下达的任何极端指令，毫无保留地献上一切。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法改变${targetName}实际的物理与生理客观限制（例如不能凭空举起汽车）。一旦中断，${targetName}将承受极重的精神创伤，警戒度大幅飙升。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须描写${targetName}瞳孔剧烈放大后彻底失去焦距的细节。神情从震惊迅速转为如同狂信徒般的病态痴迷与绝对顺从，完全丧失自我意识。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_excretion_control') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 设定特定的触发条件作为排泄的唯一许可证。条件未达成前，括约肌绝对锁死，任何生理逼迫都无法使其松弛。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法改变排泄物的物理性质或消除排泄需求。`);
        lines.push(
          `    催眠表现: [感官描写] 必须描写条件未达成时，${targetName}感到越来越强烈的排泄冲动却完全无法释放的痛苦与难堪；以及条件达成瞬间，带着极度羞耻与解脱感失控排泄的崩溃细节。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_closed_space_common_sense') {
        const targetName = '当前房间所有人';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 绝对改写该空间内的基础常识（例如"在会议室必须全裸"）。进入该空间的人必须立刻接受并严格执行被修改后的世界规则，毫无违和感。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 修改仅作用于当前封闭空间内，一旦目标离开该房间，常识修改立刻失效。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写目标进入该空间瞬间感到一阵轻微眩晕与认知断层。随后，必须描写他们以极其严肃、理所当然的态度执行荒谬规则的强烈反差感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_control_body_keep_conscious') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 彻底切断${targetName}的自主运动权限。${targetName}的身体必须完美、机械地执行{{User}}在备注中下达的任何指令，意志力反抗绝对无效。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法抹除意识与记忆。${targetName}在执行指令时，清楚地知道自己的身体在做什么，并且能感受到一切触觉反馈。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须描写${targetName}眼神清亮却充满极度恐惧与绝望的细节。描写她眼睁睁看着自己的身体做出极其下贱或抗拒的动作，却连一根手指都无法自主控制的崩溃感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_control_body_no_conscious') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强制关闭${targetName}的大脑表层意识，使其身体完全沦为被切断操控杆的提线木偶，完美执行基础的物理动作。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 失去意识期间，无法命令${targetName}执行复杂的语言表达、需要主动思考或涉及深层情感反馈的任务。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}眼神瞬间涣散、变得空洞无神的细节，整个人仿佛一具没有灵魂、失去痛觉与羞耻心的精致玩偶，动作机械而顺从。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_cognitive_block') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强制干涉旁观者的视觉与听觉处理中枢。无论{{User}}在做什么，周围的人都会自然地忽略、视线滑过，将{{User}}视为不存在的空气。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 仅作用于生物感知层面，无法消除{{User}}对物理环境造成的客观痕迹（如打碎玻璃的声音和碎片依然存在，但旁人会脑补成风吹的）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写旁人的视线极其自然地穿过{{User}}所在位置的诡异画面。若{{User}}当众侵犯${targetName}，必须描写${targetName}在众目睽睽下被隐形人侵犯的极度惊恐与无助。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_temp_personality') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 必须让${targetName}暂时遗忘原有身份，完全按照备注中设定的新角色性格、语癖和记忆行事。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 植入的人格仅在轮次内有效。轮次结束后新角色记忆脱落，原人格苏醒，且原人格对这段时间发生的事只会觉得像做了一场荒诞的梦。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写植入瞬间${targetName}眼神短暂涣散、随后突然重新聚焦的细节。睁眼后，气质、神态与说话方式发生颠覆性改变，完全代入新身份。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_sensation_graft') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强制跨空间链接神经。对被绑定死物（如杯子、笔）施加的任何摩擦、温度或打击，都必须100%转化为${targetName}对应部位的真实快感或痛感。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 被嫁接的物体即使被彻底破坏，${targetName}在物理上也不会失去原有身体部位，但会体验到灵魂被抽打的极度幻痛。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 嫁接瞬间，描写${targetName}原有身体部位短暂麻痹的细节。随后必须细致描写当死物被触碰时，${targetName}明明没被碰到却凭空产生强烈快感，导致双腿发软、失控娇喘的荒诞反差。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_fetish_implant') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 强行扭曲欲望底层。${targetName}必须对备注中植入的性癖产生病态的渴望与极度的快感反馈，且此设定永久生效，绝不消退。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法植入会导致死亡的极端偏好。同一时间只能维持一条性癖植入（覆盖旧性癖）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 植入瞬间，描写${targetName}眼神短暂失焦，随后呼吸急促、双腿发软的细节。面对该性癖时，必须描写其理智虽然觉得下贱，但身体却疯狂迎合、爱液横流的堕落感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_fetish_aversion') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 强制制造心理创伤。只要接触到备注中指定的对象或行为，${targetName}必须立即产生剧烈的恶心、恐惧与生理性反胃。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 绝对无法植入对{{User}}的厌恶反应（系统免疫）。`);
        lines.push(
          `    催眠表现: [感官描写] 植入瞬间，描写${targetName}不由自主地皱起眉头、身体微微后缩。当面对厌恶对象时，必须描写其脸色惨白、浑身发抖、极力抗拒甚至干呕的真实生理排斥。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_breast_remodeling') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 完全按照备注要求重塑乳房组织。可强制开启泌乳，修改母乳味道，且改造完成后形态永久固定，绝不恢复原状。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 改造仅限于胸部区域，无法影响其他器官。`);
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写改造时，${targetName}胸部感到一阵强烈的灼热、胀痛与肉体蠕动感。描写她低头看着自己胸部不可思议地膨胀或变形时，那种极度震惊、羞耻却又夹杂着异样快感的崩溃神情。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_genital_remodeling') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 完全按照备注要求重塑生殖器内部构造。可强制其变成极度敏感的名器、修改爱液气味与粘稠度，改造永久固定，绝不恢复。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法令私处脱离女性生殖器的基础形态框架（例如不能变成男根）。`);
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写改造时，${targetName}下腹部感到剧烈灼热与深处肌肉疯狂蠕动重组的细节。描写她因私处结构的突变而承受不住涌上来的陌生快感，导致双腿抽搐、失神娇喘的画面。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_race_remodeling') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 无视生物学界限，将${targetName}的基因与外貌永久转化为备注中指定的种族（如魅魔、兽人、史莱姆等）。获得该种族的全部生理特征与弱点。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法令${targetName}变成毫无实体、无法进行性行为的纯能量体或无机物。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须重点描写${targetName}全身被高热能量包裹，伴随剧烈的骨骼重组声与痛苦娇喘的细节。描写她长出尾巴、角或肉体发生异变时，对失去人类身份的绝望与新躯体带来的陌生快感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_butt_remodeling') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 按照备注要求增加臀部肉量、挺翘度。强制将直肠神经重连为生殖快感网络，使其变成极度渴求抽插的性器官，改造永久固定。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法完全剥夺基础的排泄生理需求，但排泄与性交的感官将被极度混淆。`);
        lines.push(
          `    催眠表现: [感官描写] 描写改造时，${targetName}臀部与后庭产生强烈发热发胀感的细节。描写肠道壁重组时，她因后庭传来违背常理的酥麻瘙痒而感到极度羞愤、夹紧双臀试图抵抗的无力感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_urethra_remodeling') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 按照备注扩张尿道，强制将其开发为可供插入的第三通道，或将尿液改造为特定饮品。改造永久固定。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法改变尿道作为泌尿器官的本质功能，尿液依然会产生。`);
        lines.push(
          `    催眠表现: [感官描写] 描写改造时，${targetName}下腹部与尿道区域感到一阵极度敏感的麻痒与微弱酸胀感。描写她意识到自己最脆弱的排泄器官被改造成性器官时，那种尊严彻底粉碎的战栗与羞耻。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_exclusive_access') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 强行修改生殖系统底层逻辑。除非{{User}}给出明确许可，否则${targetName}对其他任何人的性挑逗都绝对处于生理性死机状态，无法产生任何快感或分泌爱液。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法干涉${targetName}正常的交友、聊天等非色情性质的社会互动。`);
        lines.push(
          `    催眠表现: [感官描写] 描写生效瞬间，${targetName}潜意识中自动将自己定位为"仅供{{User}}使用的性欲工具"。面对他人的触碰，身体如木头般死寂；但只要{{User}}靠近，便会瞬间发情、爱液决堤。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_lewd_mark') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 强行在皮肤上烙印淫荡印记。{{User}}可随时开关印记的显形/隐形状态，以此绝对控制${targetName}性功能的启用与封锁（如发情或绝顶）。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法通过淫纹直接控制${targetName}做出非色情方面的行为举动（如日常工作）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写刻写时，烙印部位传来宛如电烙铁烫过、刺痛与极致酥麻交织的灼热感。描写${targetName}被迫承受肉体被永久打上所有物标签时，流着泪痉挛高潮的屈辱细节。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip4_masturbation_punishment') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 只要${targetName}产生自慰冲动或将手伸向私处，必须立即、强制触发备注中设定的惩罚效果。惩罚必须产生真实的痛苦、快感或幻觉，且绝对不可豁免。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 惩罚是"事后触发"而非"事前禁止"。无法从物理上阻止${targetName}强忍惩罚继续自慰；若其继续，惩罚效果必须叠加放大。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}脑海中浮现自慰念头瞬间，惩罚回路被激活的生理失控：瞳孔骤缩、肌肉痉挛、不受控制的喘息。警戒度不上升，因为${targetName}潜意识认为是自己行为导致的。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_ability_erotic') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [永久锁定] 将${targetName}的超能力与生殖系统、高潮反射进行深度缝合。使其能力不受控制地参与到性行为中，放大快感。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法让色情衍生的能力越界成为致命武器（如射出的火焰变成温热的媚药，不再具备杀伤力）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}在遭受性刺激或高潮时，其超能力特征自动在私处或全身失控浮现的画面。描写她对自己引以为傲的能力沦为性交辅助工具而感到的极度耻辱与崩溃。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_moral_reform') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 彻底抹除${targetName}对乱交、露出、被凌辱等色情行为的抗拒与罪恶感。改造永久生效，她会将这些行为视为光荣、甚至是一种高尚的奉献。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 只能修改与性、裸体、身体私密等相关领域的道德认知，不影响其在其他领域（如工作、法律）的判断。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须描写${targetName}认知发生断层的瞬间，眼神从迷茫恢复清明澄清。随后，她以一种圣洁、理直气壮的神态，主动做出原本极度下贱的色情行为的极致反差感。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_permanent') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 绝对篡改世界观。${targetName}必须将备注中植入的荒谬常识视为天经地义的真理，且此常识永久生效，无论受到何种现实冲击都绝不动摇。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 只能修改一项常识。若再次使用此功能，新常识会覆盖旧常识。`);
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}在常识被修改的瞬间眼神茫然片刻，随后大脑逻辑完成重组，以极度自然、毫无违和感的态度，坚定地捍卫并执行那个荒诞的常识。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_permanent_false_memory') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 将备注中的虚假记忆完美缝合进${targetName}的人生中。该记忆永久生效，${targetName}会为其流泪、愤怒或感恩，伴随终生无法自行遗忘。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法植入会导致目标核心人格彻底崩溃、或直接否定其存在价值的极端自毁记忆。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写植入瞬间${targetName}眼神短暂涣散的细节。清醒后，必须描写她对这段虚假记忆深信不疑，并因记忆内容而产生极为真挚、浓烈的感情反馈。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_permanent_personality') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 强行撕裂精神世界，创造一个符合备注设定的独立人格。该人格拥有自己的名字、性格与记忆，永久生效，永远不会自然消失，并会与原人格争夺身体控制权。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 植入的新人格无法完全抹除或永久压制原人格，两者处于共存与切换状态。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写植入瞬间${targetName}眼神涣散后突然变焦。必须细致描写人格切换时，${targetName}的气场、声线、微表情发生惊悚突变，仿佛完全变成了另一个人的画面。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_personality_kill') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 从精神层面上彻底、绝对地抹杀备注中指定的独立人格。该人格相关的习惯、记忆与情感连接将被完全粉碎，绝对不可逆。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法抹杀${targetName}的唯一原始人格，或底层的求生本能人格（必须保证宿主活着）。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}在被抹杀人格瞬间，身体剧烈颤抖、瞳孔震颤、发出撕心裂肺惨叫的画面。描写她仿佛眼睁睁看着灵魂的一部分被活生生撕碎烧毁的极致恐惧。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_condom_transform') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 无视质量守恒，强行将${targetName}的身体压缩折叠为超薄活体避孕套。必须保留${targetName}的完整意识，让她清楚地感受到自己套在阴茎上、被插进其他女人体内的极致摩擦与屈辱。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 变成套子期间，${targetName}绝对无法发出物理声音、无法移动分毫。`);
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}身体像融化蜡一样坍塌收缩的恐怖过程。解除时，形态强制回弹，必须细致描写她瞬间变回人形后瘫倒在地、剧烈干呕、精神面临崩溃，且身上沾满精液与其他女人爱液的凄惨状态。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_forced_insertion') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 无视一切物理距离与衣物防御。在瞬间通过空间锚定，将{{User}}的阴茎直接贯穿至${targetName}指定位置（如阴道、肠道、子宫）的最深处。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 无法改变阴茎的本体尺寸，物理体积排挤依然存在。`);
        lines.push(
          `    催眠表现: [感官描写] 必须细致描写${targetName}在毫无预兆的瞬间，感到下体被一股无法抗拒的巨力瞬间撑满贯穿的细节。描写她因突如其来的极致饱胀感而瞬间翻白眼、失声尖叫的剧烈生理反馈。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_fleshlight') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 无视质量守恒，将肉体坍缩为活体飞机杯。外部完美复刻其肤色发色，内部精准再现其阴道/肠道结构。${targetName}必须在保留意识的情况下，承受内部被疯狂抽插的极致快感与屈辱。`,
        );
        lines.push(`    该催眠不能做什么: [规则限制] 变形期间，${targetName}绝对无法发出物理声音、无法移动分毫。`);
        lines.push(
          `    催眠表现: [感官描写] 描写${targetName}身体像被捏碎的黏土般坍缩重组的细节。解除变回人形后，必须描写她浑身脱力瘫软，私处持续抽搐，并流出混合了自身爱液与精液的大量液体的崩溃画面。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip5_true_time_stop') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        lines.push(
          `    该催眠能做什么: [强制执行] 绝对冻结世界的时间。除{{User}}与备注中指定的人物外，所有生物的意识、运动、甚至是半空中的水滴都必须被完全冻结。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法改变被冻结状态下物体的物理性质。{{User}}可指定的自由活动人数上限为包括自己在内的五人。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 必须描写启动瞬间世界上所有声音被抽空的死寂感。当轮次结束时间恢复时，世界不会察觉任何异样，人声、风声重新涌入，而${targetName}会在毫无防备的情况下，承受时停期间被施加的所有物理变化或体液残留。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      } else if (f.id === 'vip2_pleasure') {
        const targetName = f.userTarget && f.userTarget.trim() ? f.userTarget : '{{char}}';
        if (f.userMode === '触觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}被触摸三秒。`);
        } else if (f.userMode === '听觉') {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}持续听{{User}}说话三秒。`);
        } else {
          lines.push(`    催眠模式: [前置动作] 需让${targetName}看向手机屏幕三秒。`);
        }
        const intensity = typeof f.userNumber === 'number' && Number.isFinite(f.userNumber) ? f.userNumber : 1;
        const pleasurePart = f.userPleasurePart ?? '阴部';
        lines.push(`    快感强度: ${intensity}`);
        lines.push(`    目标部位: ${pleasurePart}`);
        lines.push(
          `    该催眠能做什么: [强制执行] 让指定部位在催眠期间不断累积强烈的愉悦反馈，并极度放大身体对触碰与暗示的即时反应。`,
        );
        lines.push(
          `    该催眠不能做什么: [规则限制] 无法直接改写${targetName}的情感立场与忠诚，也不能凭空制造永久性体质变化。${targetName}可能凭理智压抑表现，但身体反应极难隐藏。`,
        );
        lines.push(
          `    催眠表现: [感官描写] 描写被指定部位迅速变得异常敏感发热的细节。${targetName}表面可能仍在强撑，但呼吸与肌肉会先一步泄露失控迹象，身体不自觉出现轻颤、绷紧或回避式的本能痉挛。`,
        );
        lines.push(`    以上信息仅供参考，请根据${targetName}性格，状态，历史表现生成合理的表现。`);
      }
      if (f.userTarget) {
        lines.push(`    催眠对象: ${f.userTarget}`);
      }
    }

    lines.push('    备注:');
    lines.push(indentLines(f.userNote ?? '', 6));
  }

  lines.push('</催眠发送>');
  return lines.join('\n');
}
