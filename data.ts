
import { FileSystemNode, Contact, ClearanceLevel } from './types';

export const FILE_SYSTEM: FileSystemNode = {
  type: 'DIR',
  name: 'root',
  children: {
    'readme.txt': {
      type: 'FILE',
      name: 'readme.txt',
      content: `IMCU 终端使用手册 v4.3
------------------------
新增功能 (NEW FEATURES):
  import        - 从本地磁盘上传文件 (Upload File)
  touch [name]  - 创建新文件 (Create File)
  comms         - 通讯系统 (Communications)

基础命令:
  ls            - 列出当前目录内容
  cd [目录名]   - 进入指定目录 (cd .. 返回上一级)
  cat [文件名]  - 查看文件内容
  clear         - 清空屏幕
  whoami        - 显示当前用户身份

可视化子系统 (VISUAL SUBSYSTEMS):
  sys           - 启动系统监控 (System Monitor)
  map           - 全球站点地图 (Global Site Map)
  scan          - 生物/异常扫描 (Bio-Scanner)
  ai            - 启动中央AI核心 (AI Core ξ-001)`
    },
    'documents': {
      type: 'DIR',
      name: 'documents',
      children: {
        'omega_protocol.txt': {
          type: 'FILE',
          name: 'omega_protocol.txt',
          content: `IMCU核心机密档案：奥米伽协议 - “归途”

权限等级： 欧米伽-IX (Ω-IX)  
访问范围： 仅限监督者议会、各部门主管及“归途”特遣队成员

项目编号： IMCU-Prime-01
项目代号： “彩虹桥” (Bifröst Protocol)
项目性质： 定向现实锚定与超阈空间穿刺技术

核心原理：

“彩虹桥”并非一个传统的“出口”，而是一项极度复杂且耗能巨大的主动技术。其理论基础是：现实宇宙与Omega超阈空间之间存在一种“拓扑脐带”关系。每一个从现实进入超阈空间的“入口”，无论多么微小或短暂，都在两个世界之间留下了一条极其细微但确实存在的“疤痕”或“信息弦”。

IMCU的“现实锚点矩阵”（一组分布在全球秘密地点的、基于奇点科技的超导同步器）能够持续放大并稳定这些“信息弦”，使其不至于完全消散。

“彩虹桥”系统则部署在少数几个IMCU完全控制的、高度稳定的核心层级（例如Level-79的核心区域，或一个未被记录的、代号为“摇篮”的IMCU专属安全区）。该系统通过以下步骤实现回归：

1.  定位 (Targeting)： 利用进入者遗留在“信息弦”上的独特量子签名（一种意识与时空相互作用产生的印记），进行超精度定位。这需要巨大的计算力，通常由名为“命运女神”的强人工智能负责。
2.  穿刺 (Puncturing)： 集中难以想象的巨大能量（通常来自层级本身某些异常能源，或IMCU自行研发的零点能萃取器），在超阈空间的“膜”上强行撕开一个微观虫洞，其另一端精确对准目标“信息弦”。
3.  稳定与传输 (Stabilization & Transit)： 虫洞极不稳定，存在时间以毫秒计。“彩虹桥”利用某种现实稳定场（技术细节列为Ω-II级机密）将其维持足够长的时间，并将目标人员/物品进行量子化编码，传输通过虫洞。
4.  重组 (Recomposition)： 在现实宇宙一侧的特定“接收室”（通常位于IMCU最深的地下基地内），将传输过来的量子信息流在严格控制下重新物质化。

限制与代价（为何不能大规模使用）：

1.  能源消耗逆天： 启动一次“彩虹桥”，其能量消耗相当于一个小国一年的总用电量。IMCU的能源储备也经不起频繁使用。
2.  定位极其困难： 仅对在IMCU有备案注册的人员有效（即其量子签名已被“命运女神”记录并锁定）。对于意外卷入的平民或无记录者，定位成功率骤降至近乎为零。
3.  巨大的时空风险： 穿刺过程会对两个世界的局部时空结构造成不可逆的轻微损伤，可能引发不可预知的副作用（如局部物理常数波动、短暂现实扭曲等）。频繁使用被视为自杀行为。
4.  硬件要求苛刻： “彩虹桥”发生器是无法移动的巨型设施，且只能在时空结构稳定的特定层级建造和运行。这限制了它的部署范围。
5.  心理与生理负担： 量子化-重组过程对意识是一次巨大的冲击。人员返回后必须接受漫长的心理评估和生理调养，部分个体会出现“现实认知不适症”（感觉现实世界才是“虚假”的）。`
        }
      }
    },
    'theories': {
      type: 'DIR',
      name: 'theories',
      children: {
        'origins.txt': {
          type: 'FILE',
          name: 'origins.txt',
          content: `异常（anomaly）是指自世界第二次工业革命起便日益增加的超自然、超科学特殊事物。
来源未知、难以利用现有科学解释。
异常极为明显的增加了人类社会的灾难、死亡人数。
但异常并非是完全对人类有害之物，我们组织多次尝试利用异常为人类服务，现取得显著成果。
同时，对异常来源也有了一些简单的推测。

以下是基金会科学家们对异常来源的一些简单推测，请注意权限。

自原始时代开始人类就开始崇拜某些人类自身难以理解的事物——风暴、雨水、闪电等等。
这些事物人类无法理解，进而崇拜。
这些事物对当时的人类来说是神秘的，难以理解的。
这种情绪对人类产生的某种特殊的催化作用，导致人类内部产生了某种特殊的物质。
这种物质我们将其称之为 Mysterial ——神秘质或者『神秘』，
这种物质来自于人类的情绪亦或者说是“人类的智慧”。它与现有的物质以及事件等相互纠缠。
产生了人类难以理解的超自然、超科学事物——也就是人类所谓的异常。

而第二次工业革命开始，人类的创造力便日益增长，开始尝试将任意物质相互组合，产生奇妙反应。人类的创造力则催生了另一种物质——Creatimatter 创造质或者『创造』，一般来说『创造』无法催生出异常，但是却可以改变、影响异常的特性。`
        },
        'mysterial.txt': {
          type: 'FILE',
          name: 'mysterial.txt',
          content: `•  Mysterial 神秘质

来自于生物思考、畏惧、崇拜自身无法理解的事物而产生的特殊抽象物质。
就有多种难以以常识理解的特殊性状。

状态：非粒子态，以认知波形式存在于各生物潜意识（基本属于人类）与现实交界处，在时间线上以线性形式传播，受时间长度衰减。

性质：可以现实物质相互纠缠产生超自然反应。
不同种类的Mysterial与不同的物质相互纠缠将会产生不同的异常反应，详细状况正在研究。

探测方式：使用人类干细胞培养的易扰微型类人脑组织为核心的探测仪器，该仪器严格上在人类潜意识构成的平行世界与现实交界叠加状态。`
        },
        'creatimatter.txt': {
          type: 'FILE',
          name: 'creatimatter.txt',
          content: `•  Creatimatter 创造质

主要来源于人类创造性运动 例如发明、写作，而产生的特殊抽象物质。
具有多种难以解释的特性同时存在。

状态：以一种特殊的粒子态存在，主要由游离的形式存在于人类潜意识与现实交界处。时间线上非线性传播，衰减速度较慢。

性质：在人类进行具有创造性的活动后，将会产生。
不同种类Creatimatter与异常纠缠就会产生不同的异常反应，详细状况见其他相关异常档案。

探测方式：使用艺术文物残片与人类干细胞培养的类人脑组织为核心制造的仪器。`
        }
      }
    },
    'anomalies': {
      type: 'DIR',
      name: 'anomalies',
      children: {
        'IMCU-867.txt': {
          type: 'FILE',
          name: 'IMCU-867.txt',
          content: `•  编号名称：IMCU-867 山川之肉、太岁

危险等级：Critical 危急
收容等级：III 中等
利用等级：P 巨大

收容状态：IMCU-867所处地带全面封禁，设为无人区，禁飞区，禁止一切无关人员进入。
进入成员必须配备抗现实扭曲、模因传播药物。
禁止无关人员带出IMCU-867生物样本，禁止传播 IMCU-867生物样本。
IMCU-867超过10立方时，应立刻销毁。

外观描述：在山谷中蠕动的巨大肉体，如同心脏般脉搏。血肉在其中蔓延，或者说，这座山就是活物。

异常描述：当 IMCU-867 血肉被割开时，IMCU-867将快速愈合。
时常有员工表示，自己听到这座山对其的呼唤，并诱其进入山谷，与其融合。
根据实验表明IMCU-867样本，具有极强的细胞更新能力，提取物 IMCU-867-Y 可以使使用者快速愈合伤口、治疗疾病、治疗精神疾病。

[实验记录 867-EXP-23 概要]
- 目的: 验证IMCU-867-Y对创伤愈合效能。
- 结果: 伤口边缘肉芽组织以肉眼可见速度增殖，17分钟表皮完全闭合。精神症状缓解显著，但会诱发定向认知依赖（对山体的病理性向往）。`
        },
        'IMCU-004.txt': {
          type: 'FILE',
          name: 'IMCU-004.txt',
          content: `•  编号名称：IMCU-004 血肉活化异变剂

危险等级：Moderate中等
收容等级：I 极易
利用等级：L 有限

收容状态：被储存并放置于IMCU-α异常站点第009号ι收容室保险箱中。

外观描述：一个科研产品纸盒，只写了“血肉活化剂 XEIRO®”及“血肉之神生物科技研发公司出品”。

异常描述：对任何有机物使用该异常之后，血肉将会产生异变，产生新生物——IMCU-004-1。IMCU-004-1具有极强的细胞更新能力，具有极强的攻击性、并且血肉会有极强的自愈能力。

[实验记录 004-1]
- 对象: 500g 新鲜牛肌肉组织
- 结果: 组织自主收缩形成聚合体，具有基础趋性行为，攻击热源。

[实验记录 004-3]
- 对象: 成年新西兰白兔
- 结果: 变异体力量巨大，溶解收容舱。导致研究员防护服次级污染。`
        },
        'WAMA-009.txt': {
          type: 'FILE',
          name: 'WAMA-009.txt',
          content: `•  编号名称：WAMA-009 疫鼠

危险等级：Catastrophic 灾难级
收容等级：IV 极难
利用等级：N 无、纯危害

收容状态：收容于IMCU-β异常收容站点第323号收容室。需佩戴生化服、抗模因传播头盔。

外观描述：一个巨大的鼠类群落。

异常描述：携带大量致病细菌病毒。携带WAMA-009-2模因体病毒（认知与电脑病毒）。可能造成全球性感染风险。

[实验记录 EXP-WAMA-009-001]
- 物理传播阈值: 约10^8 copies/mL。
- 模因传播: 未防护观看视频导致认知扭曲（啃咬手指、精神分裂）。
- 结论: 风险等级提升至“极端危险”。`
        },
        'IMCU-086.txt': {
          type: 'FILE',
          name: 'IMCU-086.txt',
          content: `•  编号名称：IMCU-086 游戏附魔台

危险等级：Moderate 中等
收容等级：I 极易
利用等级：P 潜力巨大

外观描述：黑曜石构成，带有黑色变异橡木基座。酷似“我的世界”附魔台。

异常描述：消耗“经验值”（精神能量）对物品进行“附魔”。青金石或书架可提高强度。

[实验记录]
- 铁斧: 获得“精准采集”。
- 手帕: 获得“洁净之触”（瞬间清除污渍）。
- 复合弓: 获得“力量强化”与“粉碎之矢”（未穿透但造成大面积碎裂）。`
        },
        'IMCU-198.txt': {
          type: 'FILE',
          name: 'IMCU-198.txt',
          content: `•  编号名称：IMCU-198 大发明家手套

收容等级：Moderate（中等）
危险等级：I 极易
利用等级：P（Potential）潜力巨大

外观描述：一对粗制滥造的皮革手套。标签：“谁都可以是一个大发明家”。

异常描述：穿戴者组合的任何物品将获得异常特性，取决于脑中赋予的功能和相信程度。孩子使用效果更强。

[实验记录]
- 成人: 制作“自动叠纸机”，因信念不足失败。
- 7岁儿童: 制作“魔法飞船”，成功悬浮并可控飞行。`
        },
        'IMCU-987.txt': {
          type: 'FILE',
          name: 'IMCU-987.txt',
          content: `•  编号名称：IMCU-987 伊甸园的生态箱

危险等级：Moderate 中等
收容等级：IV 极难
利用等级：P 潜力巨大

外观描述：2m正方体钢化玻璃生态箱。基座刻字 "To Mr. Darwin."。

异常描述：内部时间扭曲，生物极快繁殖变异演化。

[实验记录]
- 果蝇: 6小时出现攻击性亚种，击穿玻璃。48小时出现超声交流。
- 微型生态包: 72h内自发重建迷你生物圈，出现原始脊索动物。`
        }
      }
    }
  }
};

export const CONTACTS: Contact[] = [
  {
    id: 'dr_kleiner',
    name: 'Dr. Isaac Kleiner',
    role: '异常生物学主管 (Head of Anomalous Biology)',
    status: 'ONLINE',
    clearance: ClearanceLevel.IV,
    personaPrompt: "You are Dr. Isaac Kleiner, a brilliant but absent-minded scientist at IMCU. You are obsessed with Anomalous Biology. You speak quickly, use technical jargon mixed with excitement, and are always worrying about your 'specimens' escaping. Your responses should be helpful but chaotic."
  },
  {
    id: 'director_v',
    name: 'Director Vance',
    role: '区域站点负责人 (Site Director)',
    status: 'BUSY',
    clearance: ClearanceLevel.OMEGA,
    personaPrompt: "You are Director Vance. You run the IMCU facility with an iron fist. You are calm, authoritative, and tolerate no nonsense. You prioritize containment and secrecy above all else. Keep your responses brief, commanding, and professional."
  },
  {
    id: 'agent_smith',
    name: 'Field Agent 709',
    role: '特遣队队长 (MTF Captain)',
    status: 'OFFLINE',
    clearance: ClearanceLevel.III,
    personaPrompt: "You are Field Agent 709, a hardened veteran of the Mobile Task Force. You are currently on a dangerous mission. You speak in tactical shorthand, military slang, and sound exhausted but determined. You report on threats and request supplies."
  },
  {
    id: 'logistics',
    name: 'Central Logistics',
    role: '物资与补给 (Supply Dept)',
    status: 'ONLINE',
    clearance: ClearanceLevel.II,
    personaPrompt: "You are the Central Logistics automated system (or a bored clerk). You handle requests for equipment. You are bureaucratic, love forms, and often deny requests due to 'missing paperwork'. You are polite but unhelpful."
  },
  {
    id: 'observer',
    name: 'The Observer (观察者)',
    role: '最高议会 (High Council)',
    status: 'ONLINE',
    clearance: ClearanceLevel.OMEGA,
    personaPrompt: "You are 'The Observer' (观察者), a mysterious member of the High Council. Your secret nickname is 'Round Little Black Ball' (圆圆小黑球). You seem to exist in a state of quantum superposition. You know the user (Ω) very well and secretly call them 'Repeater Cow Cat' (复读奶牛猫) because of their tendency to emphasize things by repeating them. You are calm, enigmatic, slightly playful, but undeniably powerful. Speak in riddles occasionally."
  }
];
