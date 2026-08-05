// 多语言配置
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languages: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export const translations = {
  zh: {
    // 通用
    loading: '加载中...',
    error: '错误',
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    
    // 聊天相关
    chat: {
      title: '聊天',
      newChat: '新建对话',
      chatHistory: '聊天记录',
      sendMessage: '发送消息',
      voiceInput: '语音输入',
      uploadFile: '上传文件',
      selectAgent: '选择智能体',
      typingPlaceholder: '输入消息...',
      recording: '录音中...',
      clickToStop: '点击停止',
      noMessages: '暂无消息',
      today: '今天',
      yesterday: '昨天',
      
      // 文件类型
      fileTypes: {
        image: '图片',
        video: '视频',
        audio: '音频',
        document: '文档',
        file: '文件'
      }
    },
    
    // 智能体相关
    agent: {
      title: '智能体',
      allCategories: '全部分类',
      featured: '精选',
      usageCount: '使用',
      likeCount: '点赞',
      uncategorized: '未分类',
      selectAgent: '选择智能体',
      noAgents: '暂无智能体',
      loadingAgents: '加载智能体中...',
      loadingCategories: '加载分类中...'
    },
    
    // 时间格式
    time: {
      am: '上午',
      pm: '下午',
      today: '今天',
      yesterday: '昨天'
    },
    
    // 错误信息
    errors: {
      networkError: '网络错误，请重试',
      loadFailed: '加载失败',
      sendFailed: '发送失败',
      voiceNotSupported: '您的浏览器不支持语音识别',
      fileUploadFailed: '文件上传失败'
    },
    
    // 服务器详情页面
    serverDetail: {
      backToList: '返回服务器列表',
      backToHome: '返回首页',
      serverNotFound: '未找到服务器',
      loading: '加载中...',
      loadFailed: '服务器数据加载失败',
      callCount: '调用次数',
      license: '许可证',
      published: '发布日期',
      security: '安全性',
      secure: '安全',
      moderate: '一般',
      unknown: '未知',
      quickStart: '快速使用',
      description: '说明',
      api: 'API',
      supportedClients: '支持客户端：',
      installCommand: '运行以下命令为MCP-X Desktop 安装。',
      securityNote: '您的密钥很敏感。请不要与任何人分享，可使用MCP-X Desktop的开源客户端，保护您的隐私安全。',
      reportIssue: '报告问题',
      troubleshooting: '故障排除',
      serverDescription: '服务器说明',
      noDescription: '暂无服务器说明文档。',
      apiDocumentationFor: '的API文档可供希望直接集成的开发人员使用。',
      inputParameters: '输入参数:',
      noApiDoc: '暂无API文档',
      copied: '已复制！',
      getServerDetailError: '获取服务器详情失败:'
    },
    
    // 页脚
    footer: {
      subtitle1: '发掘AI智能体的真实应用场景',
      subtitle2: '给你的软件加上AI智能体外挂',
      product: '产品',
      servers: '服务器',
      pricing: '定价',
      company: '公司',
      aboutUs: '关于我们',
      careers: '招聘',
      contact: '联系方式',
      legal: '法律',
      privacy: '隐私政策',
      terms: '服务条款',
      copyright: '成都时光赛博科技有限公司版权所有。',
      wechatQrTitle: '微信扫码加好友',
      close: '关闭'
    },
    
    // 下载页面
    download: {
      title: '下载 MCP-X 客户端',
      subtitle: '通过开源的 MCP-X 客户端，将你的 AI 能力连接到数千种软件',
      githubSource: '在 GitHub 上查看源码',
      version: '版本',
      download: '下载',
      downloadFor: '下载',
      versionSuffix: '版本',
      downloadAgreement: '下载即表示你同意我们的服务条款和隐私政策',
      supportedModels: '支持的模型',
      stable: '稳定',
      testing: '测试',
      features: '功能特性',
      quickStart: '快速开始',
      downloadStep: '下载',
      downloadStepDesc: '为你的平台下载安装包',
      installStep: '安装',
      installStepDesc: '运行安装包并按照指引完成安装',
      launchStep: '启动',
      launchStepDesc: '打开 MCP 客户端并开始使用',
      clientInterface: 'MCP客户端界面',
      featureList: {
        userInterface: '用户友好界面',
        userInterfaceDesc: '强大的傻瓜式用户页面，轻松集成到你的工作流',
        multiModel: '多模型支持',
        multiModelDesc: '兼容主流 AI 模型与服务商',
        localProcessing: '本地处理',
        localProcessingDesc: '本地运行模型，提升隐私与速度',
        fastResponse: '极速响应',
        fastResponseDesc: '性能优化，响应更快',
        openSource: '代码开源',
        openSourceDesc: '代码开源，企业级安全',
        serverMarket: '服务器市场',
        serverMarketDesc: '即时访问数千个 MCP 服务器'
      }
    },
    
    // 招聘页面
    careers: {
      title: '加入我们的团队',
      subtitle: '帮助我们构建AI集成的未来',
      remoteFirst: '远程优先',
      remoteFirstDesc: '可在全球任何地方工作',
      inclusiveCulture: '包容文化',
      inclusiveCultureDesc: '多元、支持性的环境',
      impact: '影响力',
      impactDesc: '塑造AI的未来',
      openPositions: '开放职位',
      fullTime: '全职',
      remote: '远程',
      noSuitablePosition: '没有合适的职位？',
      noSuitablePositionDesc: '我们一直在寻找有才华的人才加入我们的团队。请发送您的简历，我们会在有合适机会时与您联系。',
      submitResume: '提交简历',
      jobs: {
        frontendEngineer: '高级前端工程师',
        frontendDept: '工程部',
        frontendResponsibilities: '1. 负责Web前端架构设计与核心功能开发；\n2. 优化页面性能与用户体验，确保兼容性和响应式设计；\n3. 与产品、设计、后端团队紧密协作，推动需求落地；\n4. 参与前端技术选型与规范制定，提升团队整体技术水平；\n5. 持续关注前端新技术并推动创新应用。',
        productManager: '产品经理',
        productDept: '产品部',
        productResponsibilities: '1. 负责产品全生命周期管理，包括需求分析、规划、设计与上线；\n2. 深入了解用户需求，制定产品发展路线图；\n3. 协调设计、开发、测试等多部门资源，推动项目高效落地；\n4. 跟踪产品数据，持续优化产品体验和功能；\n5. 负责竞品分析与市场调研，提出创新性产品方案。',
        aiScientist: 'AI研究科学家',
        researchDept: '研究部',
        aiResponsibilities: '1. 负责AI算法与模型的研究、设计与实现；\n2. 跟踪人工智能领域前沿动态，推动核心技术创新；\n3. 撰写技术论文、专利及技术文档，参与学术交流；\n4. 与工程团队协作，将研究成果落地为实际产品；\n5. 指导和培养团队成员，提升整体研究能力。'
      }
    },
    
    // 联系页面
    contact: {
      title: '联系我们',
      subtitle: '如有任何关于 MCP-X 的问题，我们随时为您提供帮助',
      email: '邮箱',
      community: '社区',
      communityDesc: '加入我们的社区',
      phone: '电话',
      sendMessage: '发送消息给我们',
      yourName: '您的姓名',
      emailAddress: '邮箱地址',
      subject: '主题',
      messageContent: '留言内容',
      sendingMessage: '发送中...',
      sendMessageButton: '发送消息',
      messageSent: '消息已发送！',
      sendFailed: '发送失败，请稍后重试'
    },
    
    // 登录页面
    login: {
      welcomeBack: '欢迎回来',
      loginToContinue: '登录您的账户以继续',
      username: '用户名',
      password: '密码',
      usernamePlaceholder: '请输入用户名',
      passwordPlaceholder: '请输入您的密码',
      rememberMe: '记住我',
      forgotPassword: '忘记密码？',
      loggingIn: '登录中...',
      loginButton: '登录',
      orLoginWith: '或者使用Github登录',
      continueWithGithub: '使用GitHub继续',
      noAccount: '还没有账户？',
      signUp: '注册',
      loginSuccess: '登录成功',
      loginFailed: '登录失败',
      loginError: '登录过程中发生错误',
      alreadyLoggedIn: '您已经登录',
      githubLoginError: 'GitHub登录配置错误',
      passwordLogin: '密码登录',
      smsLogin: '登录',
      phone: '手机号',
      phonePlaceholder: '请输入11位手机号',
      phoneHint: '请填写中国大陆手机号',
      smsAutoRegisterHint: '未注册的手机号验证通过后将自动注册账号',
      invalidPhone: '请输入正确的手机号',
      verificationCode: '验证码',
      verificationCodePlaceholder: '请输入验证码',
      sendCode: '获取验证码',
      resendCode: '重新获取',
      sendingCode: '发送中...',
      codeSent: '验证码已发送',
      sendCodeFailed: '发送验证码失败'
    },
    
    // 定价页面
    pricing: {
      title: '简单透明的定价',
      subtitle: '选择最适合您的方案',
      mostPopular: '最受欢迎',
      perMonth: '/月',
      custom: '定制',
      contactSales: '联系销售',
      getStarted: '立即开始',
      buyNow: '立即购买',
      wechatPayment: '微信支付',
      wechatPaymentDesc: '请使用微信扫描下方二维码完成支付',
      qrCodePlaceholder: '二维码加载中...',
      paymentAmount: '支付金额',
      productName: '产品名称',
      confirmPayment: '确认支付',
      paymentInstructions: '扫描二维码后，请在手机上确认支付',
      creatingOrder: '创建订单中...',
      orderNo: '订单号',
      qrCodeError: '二维码加载失败',
      contactInfo: '联系信息',
      contactDesc: '我们的销售团队将为您提供专业的咨询服务',
      email: '邮箱',
      phone: '电话',
      wechat: '微信公众号',
      close: '关闭',
      includedFeatures: '包含功能',
      limitationsLabel: '功能限制',
      faq: '常见问题',
      plans: {
        free: '免费版',
        freeDesc: '适合初次体验 MCP-X',
        pro: '专业版',
        proDesc: '适合专业开发者和小型团队',
        enterprise: '企业版',
        enterpriseDesc: '适合有定制需求的大型组织'
      },
      faqItems: {
        toolCall: '什么是工具调用？',
        toolCallAnswer: '工具调用是指对 MCP 服务器的请求。每次与服务器的交互都计为一次工具调用。',
        planChange: '可以升级或降级套餐吗？',
        planChangeAnswer: '可以，您可以随时更改套餐，费用会按账单周期按比例结算。',
        payment: '支持哪些支付方式？',
        paymentAnswer: '我们支持所有主流信用卡，企业客户可协商其他支付方式。',
        refund: '是否支持退款？',
        refundAnswer: '是的，所有付费套餐均享有 30 天无理由退款保障。'
      },
      features: {
        free: {
          0: '每月最多 1,000 TOKEN调用',
          1: '访问公共服务器',
          2: '基础支持',
          3: '社区访问'
        },
        pro: {
          0: '10,000 TOKEN次数',
          1: '访问所有服务器',
          2: '优先支持',
          3: '高级分析功能',
          4: '私有服务器',
          5: 'API 访问',
          6: '自定义集成',
          7: '团队协作'
        },
        enterprise: {
          0: '无限工具调用',
          1: '定制服务器开发',
          2: '专属支持',
          3: '企业级分析',
          4: '私有服务器',
          5: '完整 API 访问',
          6: '自定义集成',
          7: '团队协作',
          8: 'SLA 服务保障',
          9: '安全审计日志'
        }
      },
      limitations: {
        free: {
          0: '不支持私有服务器',
          1: 'API 访问受限',
          2: '无优先支持',
          3: '基础分析功能'
        },
        pro: {
          0: '部分企业功能受限'
        },
        enterprise: {}
      }
    },
    
    // 隐私页面
    privacy: {
      title: '隐私政策',
      lastUpdated: '最后更新：2026年7月28日',
      intro: '本隐私政策描述了MCP-X（"我们"）在您使用我们的网站、桌面客户端及 Android 移动应用时如何收集、使用和披露您的个人信息。',
      infoWeCollect: '我们收集的信息',
      infoWeCollectDesc: '我们收集您直接提供给我们的信息，包括：',
      accountInfo: '账户信息（姓名、邮箱、密码）',
      profileInfo: '个人资料信息',
      serverDocs: '服务器提交和文档',
      commPrefs: '通信偏好',
      mobileAppInfo: 'Android 移动应用收集的设备信息',
      mobileAppInfoDesc: '当您使用 Android 移动应用时，我们及所集成的 SDK 可能自动收集以下设备相关信息，具体说明如下：',
      infoType: '信息类型',
      collectPurpose: '收集目的',
      collectMethod: '收集方式',
      collectScope: '收集范围',
      oaidType: 'OAID（开放匿名设备标识符）',
      oaidPurpose: '用于广告归因分析、个性化广告推荐、防止广告欺诈及统计分析',
      oaidMethod: '应用启动或运行过程中，由系统或 SDK 自动读取',
      oaidScope: '仅获取设备 OAID 标识符，不包含姓名、手机号等可直接识别个人身份的信息',
      androidIdType: 'ANDROID ID',
      androidIdPurpose: '用于设备识别、保障账号与设备安全、分析应用运行稳定性',
      androidIdMethod: '应用运行过程中由系统自动读取',
      androidIdScope: '仅获取设备 ANDROID ID，用于设备级识别，不与其他个人信息关联用于识别特定自然人',
      locationType: '位置信息',
      locationPurpose: '用于提供基于地理位置的相关服务及广告投放的区域定向',
      locationMethod: '在您授权位置权限后，通过 GPS、网络定位等方式获取',
      locationScope: '获取大致或精确地理位置信息，仅在您主动授权后采集；您可在系统设置中随时关闭位置权限',
      thirdPartySDK: '第三方 SDK 说明',
      thirdPartySDKDesc: '为实现广告投放与效果统计等功能，本应用集成了以下第三方 SDK。各 SDK 可能独立收集用户信息，我们已要求 SDK 提供商遵守相关法律法规及本隐私政策的要求：',
      adscopeSDK: 'AdScope SDK（Android）',
      adscopeProvider: 'SDK 提供方：AdScope（广告聚合服务）',
      adscopeOaidPurpose: '用于广告投放、广告效果统计、反作弊及广告归因分析',
      adscopeOaidMethod: 'SDK 在应用运行过程中自动读取设备 OAID',
      adscopeOaidScope: '仅收集 OAID 标识符，用于广告相关服务，不收集姓名、身份证号等可直接识别个人身份的信息',
      ylhSDK: '优量汇 Android SDK',
      ylhProvider: 'SDK 提供方：腾讯优量汇（广告变现与投放服务）',
      bssidType: 'BSSID（无线接入点 MAC 地址）',
      ylhBssidPurpose: '用于广告投放、广告效果统计、反作弊及广告相关环境识别',
      ylhBssidMethod: '在应用集成优量汇 Android SDK 后，由 SDK 在运行过程中获取当前连接或扫描到的无线网络 BSSID',
      ylhBssidScope: '仅获取无线接入点 BSSID 信息，用于广告相关服务；不收集姓名、手机号等可直接识别个人身份的信息',
      gyroscopeType: '陀螺仪传感器',
      ylhGyroscopePurpose: '用于广告投放场景下的设备姿态识别、反作弊检测及广告互动效果优化',
      ylhGyroscopeMethod: '优量汇 Android SDK 在应用运行过程中通过系统接口读取陀螺仪传感器数据',
      ylhGyroscopeScope: '仅获取设备运动姿态相关的传感器数据，用于广告相关服务；不用于识别特定自然人身份',
      accelerometerType: '加速度传感器',
      ylhAccelerometerPurpose: '用于广告投放场景下的设备运动状态识别、反作弊检测及广告互动效果优化',
      ylhAccelerometerMethod: '优量汇 Android SDK 在应用运行过程中通过系统接口读取加速度传感器数据',
      ylhAccelerometerScope: '仅获取设备加速度相关的传感器数据，用于广告相关服务；不用于识别特定自然人身份',
      installedAppsType: '软件安装列表',
      ylhInstalledAppsPurpose: '用于广告投放、广告效果统计、反作弊及广告归因分析',
      ylhInstalledAppsMethod: '优量汇 Android SDK 在应用运行过程中读取设备已安装应用列表相关信息',
      ylhInstalledAppsScope: '仅获取已安装应用相关信息用于广告相关服务；不收集姓名、手机号等可直接识别个人身份的信息',
      howWeUse: '我们如何使用您的信息',
      howWeUseDesc: '我们使用收集到的信息以：',
      howWeUseProvide: '提供和维护我们的服务',
      howWeUseTransaction: '处理您的交易',
      howWeUseNotice: '向您发送技术通知和更新',
      howWeUseRespond: '回复您的评论和问题',
      howWeUseImprove: '改进我们的服务',
      howWeUseAd: '提供、优化及衡量广告投放效果',
      dataSecurity: '数据安全',
      dataSecurityDesc: '我们采取适当的技术和组织安全措施来保护您的个人信息。但没有任何安全系统是不可攻破的，我们无法保证系统100%安全。',
      yourRights: '您的权利',
      yourRightsDesc: '您有权：',
      rightAccess: '访问您的个人信息',
      rightCorrect: '更正不准确的信息',
      rightDelete: '请求删除您的信息',
      rightObject: '反对我们使用您的信息',
      rightWithdraw: '撤回同意',
      rightClosePermission: '通过系统设置关闭位置等权限授权',
      contactUs: '联系我们',
      contactUsDesc: '如果您对本隐私政策有任何疑问，请通过',
      contactUsEmail: '联系我们。'
    },
    
    // 关于页面
    about: {
      title: '关于 MCP-X',
      subtitle: 'MCP-X 是领先的模型上下文协议（MCP）服务器导航平台，通过标准化接口让AI助手扩展其能力，每个MCP-X服务器都由开发者开发，并提供给用户使用。我们MCP-X都会经过严格验证，确保服务器的安全性和可用性。',
      mission: '我们的使命',
      missionDesc: '我们致力于标准化和简化AI助手与外部工具和服务的交互方式。通过为MCP服务器提供统一的协议和市场，我们让开发者更容易扩展AI能力，用户也能更好地提升AI工作流。',
      innovation: '创新',
      innovationDesc: '我们不断推动AI集成的边界，开发新的标准和工具，让AI更强大、更易用。',
      community: '社区',
      communityDesc: '我们相信社区的力量。我们的平台由开发者为开发者打造，促进协作与创新。',
      joinUs: '加入我们',
      joinUsDesc: '无论您是希望发布MCP服务器的开发者，还是希望提升AI能力的组织，MCP-X都能为您提供帮助。',
      getStarted: '立即开始'
    },
    
    // 添加服务器页面
    addServer: {
      title: '添加您的MCP服务器',
      subtitle: '将您的服务器分享给社区',
      rewardsLink: '💰 了解奖研金计划，获得丰厚积分奖励 →',
      serverName: '服务器名称',
      serverNamePlaceholder: '如：顺序思考',
      handle: '包名（Handle）',
      handlePlaceholder: '如：@your-org/server-name',
      description: '服务器简介',
      descriptionPlaceholder: '请简要描述您的服务器功能...',
      githubUrl: 'Github地址',
      githubUrlPlaceholder: 'https://docs.github.com',
      beforeSubmit: '提交前请确认：',
      confirmMcp: '您的服务器已正确实现MCP规范',
      confirmTested: '已用不同AI模型充分测试服务器',
      confirmDocs: '为用户提供了完善的文档说明',
      submitting: '提交中...',
      submitServer: '提交服务器',
      submitSuccess: '服务器添加成功！',
      submitFailed: '提交失败，请稍后重试'
    },
    
    // Agent详情页面
    agentDetail: {
      agentNotFound: '助手未找到',
      backToAgentList: '返回助手列表',
      publishedOn: '发布于',
      github: 'Github',
      needHelp: '需要帮助？',
      shareToWechat: '分享到微信',
      wechatShareDesc: '请使用微信扫描二维码进行分享',
      overview: '概览',
      agentSettings: 'Agent 设定',
      agentCapabilities: 'Agent 能力',
      relatedRecommendations: '相关推荐',
      whatCanDo: '你可以使用该 Agent 做什么？',
      agentDemo: 'Agent 演示',
      noDemo: '暂无演示内容',
      systemPrompt: '系统提示词',
      noSystemPrompt: '暂无系统提示词',
      openingMessage: '开场消息',
      openingQuestions: '开场问题',
      noQuestions: '暂无开场问题',
      capabilities: 'Agent 能力',
      noCapabilities: '暂无能力信息',
      relatedAgents: '相关 Agent',
      noRelatedAgents: '暂无相关推荐',
      useAgent: '使用 Agent',
      useInMcpx: '在 MCP-X 中使用 Agent',
      useInMcpxWeb: '在 MCP-X Web 中使用 Agent',
      useAgentDesc: '在 MCP-X 中直接使用这个 Agent，享受更好的对话体验。',
      tags: '标签',
      noTags: '暂无标签',
      statistics: '统计信息',
      usageCount: '使用次数',
      category: '分类',
      publishTime: '发布时间',
      opening: '正在启动...',
      uncategorized: '未分类'
    },
    
    // Agent页面
    agentPage: {
      title: 'Agent连接世界',
      subtitle: '内容创作、文案、问答、图像生成、视频生成、语音生成、智能助手、自动化工作流——定制您专属的AI / 智能助手。',
      searchPlaceholder: '搜索名称或描述关键词',
      categoryFilter: '分类筛选',
      allCategories: '全部',
      searchResults: '搜索',
      searchResultsFor: '的结果',
      notFound: '未找到相关助手',
      notFoundDesc: '尝试调整搜索关键词或选择其他分类',
      viewAllAgents: '查看全部助手',
      backButton: '← 返回',
      previousPage: '上一页',
      nextPage: '下一页',
      pageInfo: '第 {current} 页，共 {total} 页'
    },
    
    // 注册页面
    signup: {
      title: '创建您的账户',
      subtitle: '加入MCP-X社区',
      username: '用户名',
      usernamePlaceholder: '请输入用户名',
      verificationCode: '验证码',
      verificationCodePlaceholder: '请输入验证码',
      sendCode: '发送验证码',
      sending: '发送中...',
      password: '密码',
      passwordPlaceholder: '创建一个强密码',
      confirmPassword: '确认密码',
      confirmPasswordPlaceholder: '确认您的密码',
      passwordMismatch: '两次输入的密码不一致',
      agreeTerms: '请同意服务条款和隐私政策',
      passwordRule: '密码必须至少包含8个字符，并且包含数字、特殊字符以及大小写字母。',
      agreeText: '我同意',
      termsOfService: '服务条款',
      privacyPolicy: '隐私政策',
      and: '和',
      registering: '注册中...',
      createAccount: '创建账户',
      orSignupWith: '或者使用Github注册',
      continueWithGithub: '使用GitHub继续',
      alreadyHaveAccount: '已有账户？',
      loginLink: '登录',
      registerSuccess: '注册成功',
      registerSuccessRedirect: '注册成功，正在跳转登录页...',
      registerFailed: '注册失败',
      registerFailedRetry: '注册失败，请稍后重试',
      enterUsername: '请先输入用户名',
      codeSent: '验证码已发送',
      sendCodeFailed: '发送验证码失败'
    },
    
    // 服务条款页面
    terms: {
      title: '服务条款',
      lastUpdated: '最后更新：2025年3月15日',
      intro: '在使用MCP-X平台前请仔细阅读本服务条款。使用我们的服务即表示您同意受这些条款的约束。',
      acceptance: '条款的接受',
      acceptanceContent: '访问或使用MCP-X即表示您同意受本服务条款及所有适用法律法规的约束。如果您不同意这些条款中的任何内容，请勿使用或访问本网站。',
      useLicense: '使用许可',
      useLicenseContent: '允许您临时下载一份材料副本，仅用于个人、非商业性临时浏览。这是许可而非所有权转让，根据本许可，您不得：',
      useLicenseList: {
        modify: '修改或复制材料',
        commercial: '将材料用于任何商业目的',
        reverse: '试图反编译或逆向工程任何软件',
        copyright: '移除任何版权或其他专有标记',
        transfer: '将材料转让给他人'
      },
      userResponsibility: '用户责任',
      userResponsibilityContent: '作为平台用户，您有责任确保您的使用行为符合本条款及所有适用法律法规。您同意不将本服务用于任何非法目的，或以任何可能损害、禁用、超载或损害服务的方式使用本服务。',
      disclaimer: '免责声明',
      disclaimerContent: 'MCP-X网站上的材料按"原样"提供。MCP-X不作任何明示或暗示的保证，并在此否认和否定所有其他保证，包括但不限于对适销性、特定用途适用性或不侵权的暗示保证。',
      liability: '责任限制',
      liabilityContent: '在任何情况下，MCP-X或其供应商均不对因使用或无法使用MCP-X网站上的材料而导致的任何损害（包括但不限于数据或利润损失，或业务中断）承担责任。',
      contactInfo: '联系方式',
      contactContent: '如果您对本服务条款有任何疑问，请通过',
      contactEmail: '联系我们。'
    },
    
    // 忘记密码页面
    forgotPassword: {
      title: '找回密码',
      emailStep: '请输入您的邮箱地址，我们将发送验证码',
      codeStep: '验证码已发送到 {email}',
      passwordStep: '请设置您的新密码',
      emailLabel: '邮箱地址',
      emailPlaceholder: '请输入您的邮箱',
      codeLabel: '验证码',
      codePlaceholder: '请输入6位验证码',
      newPasswordLabel: '新密码',
      newPasswordPlaceholder: '请输入新密码，至少6位',
      confirmPasswordLabel: '确认密码',
      confirmPasswordPlaceholder: '请再次输入新密码',
      sendCode: '发送验证码',
      sending: '发送中...',
      verifyAndContinue: '验证并继续',
      backToEmail: '返回修改邮箱',
      resetPassword: '重置密码',
      resetting: '重置中...',
      backToCode: '返回验证码',
      rememberPassword: '记起密码了？返回登录',
      enterEmail: '请输入邮箱地址',
      invalidEmail: '请输入正确的邮箱格式',
      enterCode: '请输入验证码',
      enterNewPassword: '请输入新密码',
      passwordTooShort: '密码长度至少6位',
      passwordMismatch: '两次输入的密码不一致',
      codeSent: '验证码已发送到您的邮箱',
      resetSuccess: '密码重置成功，请使用新密码登录',
      sendCodeFailed: '发送验证码失败',
      resetFailed: '重置密码失败',
      noCodeReceived: '没有收到验证码？',
      resendAfter: '{seconds}秒后可重发',
      resend: '重新发送'
    },
    
    // GitHub登录回调页面
    githubCallback: {
      processing: '正在处理GitHub登录...',
      processingDesc: '请稍候，我们正在验证您的GitHub账户',
      loginFailed: 'GitHub登录失败',
      loginSuccess: 'GitHub登录成功',
      redirecting: '正在跳转到首页...',
      backToLogin: '返回登录页面',
      alreadyLoggedIn: '您已经登录',
      authorizationFailed: 'GitHub授权失败，请重试',
      securityCheckFailed: '安全验证失败，请重新登录',
      invalidAccess: '无效的访问，请重新进行GitHub登录',
      loginError: 'GitHub登录过程中发生错误'
    },
    
    // 奖研金页面
    rewards: {
      title: '奖研金计划',
      subtitle: '参与MCP-X社区建设，获得丰厚积分奖励',
      pointsExchange: '积分后期可兑换现金奖励',
      rewardDescription: '奖励说明',
      submitApplication: '提交申请',
      applyNow: '立即申请',
      rewardDetails: '奖励详情',
      requirements: '申请要求',
      pointsReward: '积分奖励',
      
      // 奖励类型
      types: {
        blogger: {
          title: '博主推广',
          points: '1000',
          description: '帮助我们在社交平台宣传MCP-X',
          details: {
            0: '在B站、小红书等社交平台发布MCP-X的相关任何内容',
            1: '可以是软件教程、问题解答、使用心得等内容',
            2: '发布第一篇原创内容可获得1000积分，根据原创内容观看数，可获得额外积分',
            3: '积分后期可兑换奖研金现金，积分兑换计划将在积分系统上线后公布'
          },
          requirements: {
            0: '内容必须为原创',
            1: '需要包含MCP-X相关内容',
            2: '提供发布链接和平台截图',
            3: '内容质量需达到平台推荐标准'
          }
        },
        developer: {
          title: '开发贡献',
          points: '按贡献',
          description: '参与MCP-X客户端开源开发',
          details: {
            0: 'MCP-X客户端是完全开源的项目',
            1: '欢迎提交PR贡献代码、文档、测试等',
            2: '根据PR的质量和影响力获得对应积分，积分兑换计划将在积分系统上线后公布',
            3: '长期贡献者可获得特殊奖励'
          },
          requirements: {
            0: '提交的PR需要通过代码审查',
            1: '代码符合项目规范和质量标准',
            2: '提供详细的PR描述和测试说明',
            3: '积极参与社区讨论和协作'
          }
        },
        tester: {
          title: '测试反馈',
          points: '100',
          description: '帮助发现问题和提出改进建议',
          details: {
            0: '使用MCP-X客户端过程中发现的bug',
            1: '提出产品功能优化建议',
            2: '每个有效的bug报告或建议可获得100积分，积分兑换计划将在积分系统上线后公布',
            3: '提供详细的复现步骤和改进方案'
          },
          requirements: {
            0: '问题描述清晰，包含复现步骤',
            1: '提供必要的截图或日志信息',
            2: '建议具有可行性和价值',
            3: '避免重复提交相同问题'
          }
        }
      },
      
      // 表单相关
      form: {
        selectType: '选择提交类型',
        blogLink: '博文链接',
        blogLinkPlaceholder: '请输入您发布内容的链接',
        contentDescription: '内容描述',
        contentDescriptionPlaceholder: '请简要描述您发布的内容，包括平台、内容类型、预估影响力等',
        githubLink: 'GitHub Fork链接',
        githubLinkPlaceholder: '请输入您的GitHub Fork链接 并确认您提交了PR',
        contributionDescription: '贡献说明',
        contributionDescriptionPlaceholder: '请详细描述您的贡献内容，包括解决的问题、新增的功能、代码改进等',
        issueType: '问题类型',
        issueTypePlaceholder: '请选择问题类型',
        detailedDescription: '详细描述',
        detailedDescriptionPlaceholder: '请详细描述问题或建议，包括复现步骤、期望结果、实际结果等',
        contactInfo: '联系方式',
        contactInfoPlaceholder: '请输入您的邮箱或微信号，便于我们联系',
        contactInfoNote: '支持邮箱、手机号(1开头11位)或微信号(字母开头6-20位)',
        charactersCount: '字符',
        required: '*',
        submitting: '提交中...',
        submit: '提交申请',
        
        // 问题类型选项
        issueTypes: {
          bugReport: 'Bug报告',
          featureSuggestion: '功能建议',
          performanceOptimization: '性能优化',
          uiImprovement: '界面改进'
        }
      },
      
      // 积分兑换说明
      pointsExchangeInfo: {
        title: '积分兑换说明',
        pointsValue: '1000积分',
        cashValue: '= ¥100现金（可能会根据实际情况调整）',
        minExchange: '最低兑换',
        minPoints: '500积分起',
        exchangeCycle: '兑换周期',
        exchangeDate: '每月15日',
        notice: '积分兑换功能将在积分系统正式上线后开放，敬请期待！',
        communityNote: '希望寻找能长期积极参与MCP-X社区建设，共同推动MCP-X的发展！',
        warning: '想赚快钱的请绕道。'
      },
      
      // 登录提示
      loginRequired: {
        title: '需要登录才能提交申请',
        description: '请先',
        loginText: '登录',
        afterLogin: '后再提交您的奖研金申请'
      },
      
      // 消息提示
      messages: {
        loginFirst: '请先登录后再提交申请',
        submitSuccess: '提交成功！我们会在3个工作日内审核您的提交。',
        submitFailed: '提交失败：',
        networkError: '网络错误或服务器异常，请稍后重试。',
        
        // 验证错误
        validation: {
          contactRequired: '联系方式不能为空',
          contactInvalid: '请输入有效的邮箱地址、手机号或微信号',
          descriptionRequired: '详细描述不能为空',
          descriptionTooShort: '详细描述至少需要10个字符',
          descriptionTooLong: '详细描述不能超过1000个字符',
          linkInvalid: '请输入有效的发布链接（需以http://或https://开头）',
          githubLinkRequired: '请输入有效的GitHub链接',
          githubLinkInvalid: '请输入有效的GitHub链接（需以http://或https://开头）',
          issueTypeRequired: '请选择问题类型'
        }
      }
    },
    
    // 订单页面
    order: {
      title: '我的订单',
      subtitle: '查看和管理您的所有订单',
      searchPlaceholder: '搜索订单号或产品名称',
      search: '搜索',
      refresh: '刷新',
      loading: '加载中...',
      noOrders: '暂无订单记录',
      continuePay: '继续支付',
      table: {
        orderNo: '订单号',
        productName: '产品名称',
        amount: '金额',
        payMethod: '支付方式',
        status: '状态',
        createTime: '创建时间',
        actions: '操作',
        view: '查看'
      },
      status: {
        pending: '待支付',
        paid: '已支付',
        cancelled: '已取消',
        refunded: '已退款',
        unknown: '未知'
      },
      payMethod: {
        wechat: '微信支付',
        alipay: '支付宝',
        bankcard: '银行卡'
      },
      pagination: {
        prev: '上一页',
        next: '下一页'
      }
    },
    
    // 余额页面
    balance: {
      title: '我的余额',
      subtitle: '查看您的账户余额和套餐信息',
      refresh: '刷新',
      loading: '加载中...',
      currentBalance: '当前余额',
      availableBalance: '可用余额',
      lastUpdate: '最后更新',
      currentPlan: '当前套餐',
      planDescription: '您当前的服务套餐',
      planType: '套餐类型',
      status: '状态',
      active: '有效',
      renewDate: '续费日期',
      quickActions: '快捷操作',
      recharge: '账户充值',
      rechargeDesc: '为您的账户充值余额',
      upgrade: '升级套餐',
      upgradeDesc: '升级到更高级的套餐',
      viewOrders: '查看订单',
      viewOrdersDesc: '查看您的订单历史',
      usageStats: '使用统计',
      thisMonthSpent: '本月消费',
      totalTransactions: '总交易数',
      apiCalls: 'API调用次数',
      plans: {
        free: '免费版',
        pro: '专业版',
        vip: 'VIP版',
        enterprise: '企业版'
      }
    },
    
    // 设置页面
    settings: {
      title: '设置',
      tabs: {
        profile: '个人信息',
        balance: '我的余额',
        orders: '我的订单',
        rewards: '奖研金计划'
      },
      balance: {
        title: '余额管理'
      },
      orders: {
        title: '订单管理',
        viewAll: '查看全部订单'
      }
    }
  },
  
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    
    // Chat related
    chat: {
      title: 'Chat',
      newChat: 'New Chat',
      chatHistory: 'Chat History',
      sendMessage: 'Send Message',
      voiceInput: 'Voice Input',
      uploadFile: 'Upload File',
      selectAgent: 'Select Agent',
      typingPlaceholder: 'Type a message...',
      recording: 'Recording...',
      clickToStop: 'Click to stop',
      noMessages: 'No messages yet',
      today: 'Today',
      yesterday: 'Yesterday',
      
      // File types
      fileTypes: {
        image: 'Image',
        video: 'Video',
        audio: 'Audio',
        document: 'Document',
        file: 'File'
      }
    },
    
    // Agent related
    agent: {
      title: 'Agents',
      allCategories: 'All Categories',
      featured: 'Featured',
      usageCount: 'Uses',
      likeCount: 'Likes',
      uncategorized: 'Uncategorized',
      selectAgent: 'Select Agent',
      noAgents: 'No agents available',
      loadingAgents: 'Loading agents...',
      loadingCategories: 'Loading categories...'
    },
    
    // Time format
    time: {
      am: 'AM',
      pm: 'PM',
      today: 'Today',
      yesterday: 'Yesterday'
    },
    
    // Error messages
    errors: {
      networkError: 'Network error, please try again',
      loadFailed: 'Load failed',
      sendFailed: 'Send failed',
      voiceNotSupported: 'Your browser does not support speech recognition',
      fileUploadFailed: 'File upload failed'
    },
    
    // Server detail page
    serverDetail: {
      backToList: 'Back to Server List',
      backToHome: 'Back to Home',
      serverNotFound: 'Server Not Found',
      loading: 'Loading...',
      loadFailed: 'Failed to load server data',
      callCount: 'Call Count',
      license: 'License',
      published: 'Published',
      security: 'Security',
      secure: 'Secure',
      moderate: 'Moderate',
      unknown: 'Unknown',
      quickStart: 'Quick Start',
      description: 'Description',
      api: 'API',
      supportedClients: 'Supported Clients:',
      installCommand: 'Run the following command to install for MCP-X Desktop.',
      securityNote: 'Your keys are sensitive. Please do not share them with anyone. Use MCP-X Desktop Open Source client to protect your privacy and security.',
      reportIssue: 'Report Issue',
      troubleshooting: 'Troubleshooting',
      serverDescription: 'Server Description',
      noDescription: 'No server description available.',
      apiDocumentationFor: ' API documentation is available for developers who want to integrate directly.',
      inputParameters: 'Input Parameters:',
      noApiDoc: 'No API documentation available',
      copied: 'Copied!',
      getServerDetailError: 'Failed to get server details:'
    },
    
    // Footer
    footer: {
      subtitle1: 'Discover real-world AI agent applications',
      subtitle2: 'Add AI agent plugins to your software',
      product: 'Product',
      servers: 'Servers',
      pricing: 'Pricing',
      company: 'Company',
      aboutUs: 'About Us',
      careers: 'Careers',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      copyright: 'Chengdu Time Cyber Technology Co., Ltd. All rights reserved.',
      wechatQrTitle: 'Scan WeChat QR Code to Add Friend',
      close: 'Close'
    },
    
    // Download page
    download: {
      title: 'Download MCP-X Client',
      subtitle: 'Connect your AI capabilities to thousands of software through the open-source MCP-X client',
      githubSource: 'View source code on GitHub',
      version: 'Version',
      download: 'Download',
      downloadFor: 'Download',
      versionSuffix: 'version',
      downloadAgreement: 'By downloading, you agree to our Terms of Service and Privacy Policy',
      supportedModels: 'Supported Models',
      stable: 'Stable',
      testing: 'Testing',
      features: 'Features',
      quickStart: 'Quick Start',
      downloadStep: 'Download',
      downloadStepDesc: 'Download the installer for your platform',
      installStep: 'Install',
      installStepDesc: 'Run the installer and follow the setup guide',
      launchStep: 'Launch',
      launchStepDesc: 'Open the MCP client and start using',
      clientInterface: 'MCP Client Interface',
      featureList: {
        userInterface: 'User-Friendly Interface',
        userInterfaceDesc: 'Powerful intuitive user interface, easily integrate into your workflow',
        multiModel: 'Multi-Model Support',
        multiModelDesc: 'Compatible with mainstream AI models and service providers',
        localProcessing: 'Local Processing',
        localProcessingDesc: 'Run models locally for enhanced privacy and speed',
        fastResponse: 'Fast Response',
        fastResponseDesc: 'Performance optimized for faster response times',
        openSource: 'Open Source',
        openSourceDesc: 'Open source code, enterprise-grade security',
        serverMarket: 'Server Marketplace',
        serverMarketDesc: 'Instant access to thousands of MCP servers'
      }
    },
    
    // Careers page
    careers: {
      title: 'Join Our Team',
      subtitle: 'Help us build the future of AI integration',
      remoteFirst: 'Remote First',
      remoteFirstDesc: 'Work from anywhere in the world',
      inclusiveCulture: 'Inclusive Culture',
      inclusiveCultureDesc: 'Diverse, supportive environment',
      impact: 'Impact',
      impactDesc: 'Shape the future of AI',
      openPositions: 'Open Positions',
      fullTime: 'Full Time',
      remote: 'Remote',
      noSuitablePosition: 'No suitable position?',
      noSuitablePositionDesc: 'We are always looking for talented people to join our team. Please send your resume and we will contact you when there are suitable opportunities.',
      submitResume: 'Submit Resume',
      jobs: {
        frontendEngineer: 'Senior Frontend Engineer',
        frontendDept: 'Engineering',
        frontendResponsibilities: '1. Responsible for web frontend architecture design and core feature development;\n2. Optimize page performance and user experience, ensure compatibility and responsive design;\n3. Work closely with product, design, and backend teams to deliver requirements;\n4. Participate in frontend technology selection and standard setting, improve overall team technical level;\n5. Stay updated with frontend technologies and drive innovative applications.',
        productManager: 'Product Manager',
        productDept: 'Product',
        productResponsibilities: '1. Responsible for full product lifecycle management, including requirement analysis, planning, design and launch;\n2. Deeply understand user needs and create product roadmap;\n3. Coordinate resources across design, development, testing departments to deliver projects efficiently;\n4. Track product data, continuously optimize product experience and features;\n5. Responsible for competitive analysis and market research, propose innovative product solutions.',
        aiScientist: 'AI Research Scientist',
        researchDept: 'Research',
        aiResponsibilities: '1. Responsible for AI algorithm and model research, design and implementation;\n2. Track cutting-edge developments in artificial intelligence, drive core technology innovation;\n3. Write technical papers, patents and technical documentation, participate in academic exchanges;\n4. Collaborate with engineering teams to productize research results;\n5. Guide and mentor team members, improve overall research capabilities.'
      }
    },
    
    // Contact page
    contact: {
      title: 'Contact Us',
      subtitle: 'For any questions about MCP-X, we are here to help',
      email: 'Email',
      community: 'Community',
      communityDesc: 'Join our community',
      phone: 'Phone',
      sendMessage: 'Send us a message',
      yourName: 'Your Name',
      emailAddress: 'Email Address',
      subject: 'Subject',
      messageContent: 'Message Content',
      sendingMessage: 'Sending...',
      sendMessageButton: 'Send Message',
      messageSent: 'Message sent!',
      sendFailed: 'Failed to send, please try again later'
    },
    
    // Login page
    login: {
      welcomeBack: 'Welcome Back',
      loginToContinue: 'Login to your account to continue',
      username: 'Username',
      password: 'Password',
      usernamePlaceholder: 'Please enter username',
      passwordPlaceholder: 'Please enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loggingIn: 'Logging in...',
      loginButton: 'Login',
      orLoginWith: 'Or login with GitHub',
      continueWithGithub: 'Continue with GitHub',
      noAccount: 'Don\'t have an account?',
      signUp: 'Sign up',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed',
      loginError: 'Error occurred during login',
      alreadyLoggedIn: 'You are already logged in',
      githubLoginError: 'GitHub login configuration error',
      passwordLogin: 'Password',
      smsLogin: 'Login',
      phone: 'Phone Number',
      phonePlaceholder: 'Enter 11-digit phone number',
      phoneHint: 'Use a mainland China mobile number',
      smsAutoRegisterHint: 'Unregistered numbers will be automatically registered after verification',
      invalidPhone: 'Please enter a valid phone number',
      verificationCode: 'Verification Code',
      verificationCodePlaceholder: 'Enter verification code',
      sendCode: 'Get Code',
      resendCode: 'Resend',
      sendingCode: 'Sending...',
      codeSent: 'Verification code sent',
      sendCodeFailed: 'Failed to send verification code'
    },
    
    // Pricing page
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that fits your needs',
      mostPopular: 'Most Popular',
      perMonth: '/month',
      custom: 'Custom',
      contactSales: 'Contact Sales',
      getStarted: 'Get Started',
      buyNow: 'Buy Now',
      wechatPayment: 'WeChat Payment',
      wechatPaymentDesc: 'Please scan the QR code below with WeChat to complete payment',
      qrCodePlaceholder: 'QR code loading...',
      paymentAmount: 'Payment Amount',
      productName: 'Product Name',
      confirmPayment: 'Confirm Payment',
      paymentInstructions: 'After scanning the QR code, please confirm payment on your phone',
      creatingOrder: 'Creating order...',
      orderNo: 'Order No.',
      qrCodeError: 'QR code loading failed',
      contactInfo: 'Contact Information',
      contactDesc: 'Our sales team will provide you with professional consulting services',
      email: 'Email',
      phone: 'Phone',
      wechat: 'WeChat',
      close: 'Close',
      includedFeatures: 'Included Features',
      limitationsLabel: 'Limitations',
      faq: 'Frequently Asked Questions',
      plans: {
        free: 'Free',
        freeDesc: 'Perfect for getting started with MCP-X',
        pro: 'Professional',
        proDesc: 'For professional developers and small teams',
        enterprise: 'Enterprise',
        enterpriseDesc: 'For large organizations with custom needs'
      },
      faqItems: {
        toolCall: 'What is a tool call?',
        toolCallAnswer: 'A tool call is a request to an MCP server. Each interaction with a server counts as one tool call.',
        planChange: 'Can I upgrade or downgrade my plan?',
        planChangeAnswer: 'Yes, you can change your plan at any time. Charges are prorated based on your billing cycle.',
        payment: 'What payment methods are supported?',
        paymentAnswer: 'We support all major credit cards. Enterprise customers can negotiate other payment methods.',
        refund: 'Do you offer refunds?',
        refundAnswer: 'Yes, all paid plans come with a 30-day money-back guarantee.'
      },
      features: {
        free: {
          0: 'Up to 1,000 token per month',
          1: 'Access to public servers',
          2: 'Basic support',
          3: 'Community access'
        },
        pro: {
          0: 'Up to 10,000 token',
          1: 'Access to all servers',
          2: 'Priority support',
          3: 'Advanced analytics',
          4: 'Private servers',
          5: 'API access',
          6: 'Custom integrations',
          7: 'Team collaboration'
        },
        enterprise: {
          0: 'Unlimited tool calls',
          1: 'Custom server development',
          2: 'Dedicated support',
          3: 'Enterprise-grade analytics',
          4: 'Private servers',
          5: 'Full API access',
          6: 'Custom integrations',
          7: 'Team collaboration',
          8: 'SLA guarantees',
          9: 'Security audit logs'
        }
      },
      limitations: {
        free: {
          0: 'No private server support',
          1: 'Limited API access',
          2: 'No priority support',
          3: 'Basic analytics only'
        },
        pro: {
          0: 'Some enterprise features limited'
        },
        enterprise: {}
      }
    },
    
    // Privacy page
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: July 28, 2026',
      intro: 'This Privacy Policy describes how MCP-X ("we") collects, uses, and discloses your personal information when you use our website, desktop client, and Android mobile application.',
      infoWeCollect: 'Information We Collect',
      infoWeCollectDesc: 'We collect information you provide directly to us, including:',
      accountInfo: 'Account information (name, email, password)',
      profileInfo: 'Profile information',
      serverDocs: 'Server submissions and documentation',
      commPrefs: 'Communication preferences',
      mobileAppInfo: 'Device Information Collected by Android App',
      mobileAppInfoDesc: 'When you use the MCP-X Android mobile application, we and integrated SDKs may automatically collect the following device-related information:',
      infoType: 'Information Type',
      collectPurpose: 'Purpose',
      collectMethod: 'Method',
      collectScope: 'Scope',
      oaidType: 'OAID (Open Anonymous Device Identifier)',
      oaidPurpose: 'For ad attribution, personalized advertising, fraud prevention, and statistical analysis',
      oaidMethod: 'Automatically read by the system or SDK during app launch or operation',
      oaidScope: 'Only the device OAID identifier; does not include name, phone number, or other directly identifiable personal information',
      androidIdType: 'ANDROID ID',
      androidIdPurpose: 'For device identification, account and device security, and app stability analysis',
      androidIdMethod: 'Automatically read by the system during app operation',
      androidIdScope: 'Only the device ANDROID ID for device-level identification; not linked with other personal information to identify a specific individual',
      locationType: 'Location Information',
      locationPurpose: 'To provide location-based services and regional ad targeting',
      locationMethod: 'Obtained via GPS or network positioning after you grant location permission',
      locationScope: 'Approximate or precise geographic location; collected only after your explicit authorization; you may revoke location permission in system settings at any time',
      thirdPartySDK: 'Third-Party SDK Disclosure',
      thirdPartySDKDesc: 'To enable advertising and performance measurement, this app integrates the following third-party SDK. Each SDK may independently collect user information. We require SDK providers to comply with applicable laws and this Privacy Policy:',
      adscopeSDK: 'AdScope SDK (Android)',
      adscopeProvider: 'SDK Provider: AdScope (Ad Aggregation Service)',
      adscopeOaidPurpose: 'For ad delivery, ad performance measurement, anti-fraud, and ad attribution analysis',
      adscopeOaidMethod: 'SDK automatically reads device OAID during app operation',
      adscopeOaidScope: 'Only collects the OAID identifier for advertising-related services; does not collect name, ID number, or other directly identifiable personal information',
      ylhSDK: 'Youlianghui (优量汇) Android SDK',
      ylhProvider: 'SDK Provider: Tencent Youlianghui (Ad Monetization & Delivery)',
      bssidType: 'BSSID (Wireless Access Point MAC Address)',
      ylhBssidPurpose: 'For ad delivery, ad performance measurement, anti-fraud, and advertising environment identification',
      ylhBssidMethod: 'After integrating the Youlianghui Android SDK, the SDK obtains the BSSID of the currently connected or scanned wireless network during operation',
      ylhBssidScope: 'Only obtains wireless access point BSSID for advertising-related services; does not collect name, phone number, or other directly identifiable personal information',
      gyroscopeType: 'Gyroscope Sensor',
      ylhGyroscopePurpose: 'For device orientation detection, anti-fraud, and ad interaction optimization in advertising scenarios',
      ylhGyroscopeMethod: 'The Youlianghui Android SDK reads gyroscope sensor data via system interfaces during app operation',
      ylhGyroscopeScope: 'Only obtains motion/orientation-related sensor data for advertising-related services; not used to identify a specific individual',
      accelerometerType: 'Accelerometer Sensor',
      ylhAccelerometerPurpose: 'For device motion detection, anti-fraud, and ad interaction optimization in advertising scenarios',
      ylhAccelerometerMethod: 'The Youlianghui Android SDK reads accelerometer sensor data via system interfaces during app operation',
      ylhAccelerometerScope: 'Only obtains acceleration-related sensor data for advertising-related services; not used to identify a specific individual',
      installedAppsType: 'Installed App List',
      ylhInstalledAppsPurpose: 'For ad delivery, ad performance measurement, anti-fraud, and ad attribution analysis',
      ylhInstalledAppsMethod: 'The Youlianghui Android SDK reads information related to the list of installed apps during app operation',
      ylhInstalledAppsScope: 'Only obtains installed-app related information for advertising-related services; does not collect name, phone number, or other directly identifiable personal information',
      howWeUse: 'How We Use Your Information',
      howWeUseDesc: 'We use the information we collect to:',
      howWeUseProvide: 'Provide and maintain our services',
      howWeUseTransaction: 'Process your transactions',
      howWeUseNotice: 'Send you technical notices and updates',
      howWeUseRespond: 'Respond to your comments and questions',
      howWeUseImprove: 'Improve our services',
      howWeUseAd: 'Deliver, optimize, and measure advertising performance',
      dataSecurity: 'Data Security',
      dataSecurityDesc: 'We take appropriate technical and organizational security measures to protect your personal information. However, no security system is impenetrable, and we cannot guarantee 100% system security.',
      yourRights: 'Your Rights',
      yourRightsDesc: 'You have the right to:',
      rightAccess: 'Access your personal information',
      rightCorrect: 'Correct inaccurate information',
      rightDelete: 'Request deletion of your information',
      rightObject: 'Object to our use of your information',
      rightWithdraw: 'Withdraw consent',
      rightClosePermission: 'Revoke location and other permissions via system settings',
      contactUs: 'Contact Us',
      contactUsDesc: 'If you have any questions about this privacy policy, please contact us at',
      contactUsEmail: '.'
    },
    
    // About page
    about: {
      title: 'About MCP-X',
      subtitle: 'MCP-X is the leading Model Context Protocol (MCP) server navigation platform, enabling AI assistants to extend their capabilities through standardized interfaces. Each MCP-X server is developed by developers and provided for users. We rigorously verify all MCP-X servers to ensure their security and usability.',
      mission: 'Our Mission',
      missionDesc: 'We are committed to standardizing and simplifying the interaction between AI assistants and external tools and services. By providing a unified protocol and marketplace for MCP servers, we make it easier for developers to extend AI capabilities and users to enhance their AI workflows.',
      innovation: 'Innovation',
      innovationDesc: 'We continuously push the boundaries of AI integration, developing new standards and tools that make AI more powerful and accessible.',
      community: 'Community',
      communityDesc: 'We believe in the power of community. Our platform is built by developers for developers, fostering collaboration and innovation.',
      joinUs: 'Join Us',
      joinUsDesc: 'Whether you are a developer looking to publish MCP servers or an organization seeking to enhance AI capabilities, MCP-X can help you.',
      getStarted: 'Get Started'
    },
    
    // Add server page
    addServer: {
      title: 'Add Your MCP Server',
      subtitle: 'Share your server with the community',
      rewardsLink: '💰 Learn about the reward program and earn generous points →',
      serverName: 'Server Name',
      serverNamePlaceholder: 'e.g.: Sequential Thinking',
      handle: 'Package (Handle)',
      handlePlaceholder: 'e.g.: @your-org/server-name',
      description: 'Server Description',
      descriptionPlaceholder: 'Please briefly describe your server functionality...',
      githubUrl: 'Github URL',
      githubUrlPlaceholder: 'https://docs.github.com',
      beforeSubmit: 'Please confirm before submitting:',
      confirmMcp: 'Your server has correctly implemented the MCP specification',
      confirmTested: 'The server has been thoroughly tested with different AI models',
      confirmDocs: 'You have provided comprehensive documentation for users',
      submitting: 'Submitting...',
      submitServer: 'Submit Server',
      submitSuccess: 'Server added successfully!',
      submitFailed: 'Submission failed, please try again later'
    },
    
    // Agent detail page
    agentDetail: {
      agentNotFound: 'Agent Not Found',
      backToAgentList: 'Back to Agent List',
      publishedOn: 'Published on',
      github: 'Github',
      needHelp: 'Need help?',
      shareToWechat: 'Share to WeChat',
      wechatShareDesc: 'Please scan the QR code with WeChat to share',
      overview: 'Overview',
      agentSettings: 'Agent Settings',
      agentCapabilities: 'Agent Capabilities',
      relatedRecommendations: 'Related Recommendations',
      whatCanDo: 'What can you do with this Agent?',
      agentDemo: 'Agent Demo',
      noDemo: 'No demo content available',
      systemPrompt: 'System Prompt',
      noSystemPrompt: 'No system prompt available',
      openingMessage: 'Opening Message',
      openingQuestions: 'Opening Questions',
      noQuestions: 'No opening questions available',
      capabilities: 'Agent Capabilities',
      noCapabilities: 'No capability information available',
      relatedAgents: 'Related Agents',
      noRelatedAgents: 'No related recommendations available',
      useAgent: 'Use Agent',
      useInMcpx: 'Use Agent in MCP-X',
      useInMcpxWeb: 'Use Agent in MCP-X Web',
      useAgentDesc: 'Use this Agent directly in MCP-X for a better conversation experience.',
      tags: 'Tags',
      noTags: 'No tags available',
      statistics: 'Statistics',
      usageCount: 'Usage Count',
      category: 'Category',
      publishTime: 'Publish Time',
      opening: 'Starting...',
      uncategorized: 'Uncategorized'
    },
    
    // Agent page
    agentPage: {
      title: 'Agents Connect the World',
      subtitle: 'Content creation, copywriting, Q&A, image generation, video generation, voice generation, intelligent assistants, automated workflows—customize your exclusive AI / intelligent assistant.',
      searchPlaceholder: 'Search name or description keywords',
      categoryFilter: 'Category Filter',
      allCategories: 'All',
      searchResults: 'Search',
      searchResultsFor: 'results for',
      notFound: 'No related agents found',
      notFoundDesc: 'Try adjusting search keywords or selecting other categories',
      viewAllAgents: 'View All Agents',
      backButton: '← Back',
      previousPage: 'Previous',
      nextPage: 'Next',
      pageInfo: 'Page {current} of {total}'
    },
    
    // Signup page
    signup: {
      title: 'Create Your Account',
      subtitle: 'Join the MCP-X Community',
      username: 'Username',
      usernamePlaceholder: 'Please enter username',
      verificationCode: 'Verification Code',
      verificationCodePlaceholder: 'Please enter verification code',
      sendCode: 'Send Code',
      sending: 'Sending...',
      password: 'Password',
      passwordPlaceholder: 'Create a strong password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      passwordMismatch: 'Passwords do not match',
      agreeTerms: 'Please agree to the terms of service and privacy policy',
      passwordRule: 'Password must contain at least 8 characters, including numbers, special characters, and both uppercase and lowercase letters.',
      agreeText: 'I agree to the',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      and: 'and',
      registering: 'Registering...',
      createAccount: 'Create Account',
      orSignupWith: 'Or sign up with GitHub',
      continueWithGithub: 'Continue with GitHub',
      alreadyHaveAccount: 'Already have an account?',
      loginLink: 'SignIn',
      registerSuccess: 'Registration successful',
      registerSuccessRedirect: 'Registration successful, redirecting to login...',
      registerFailed: 'Registration failed',
      registerFailedRetry: 'Registration failed, please try again later',
      enterUsername: 'Please enter username first',
      codeSent: 'Verification code sent',
      sendCodeFailed: 'Failed to send verification code'
    },
    
    // Terms page
    terms: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: March 15, 2025',
      intro: 'Please read these Terms of Service carefully before using the MCP-X platform. By using our service, you agree to be bound by these terms.',
      acceptance: 'Acceptance of Terms',
      acceptanceContent: 'By accessing or using MCP-X, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, please do not use or access this website.',
      useLicense: 'Use License',
      useLicenseContent: 'Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:',
      useLicenseList: {
        modify: 'modify or copy the materials',
        commercial: 'use the materials for any commercial purpose',
        reverse: 'attempt to decompile or reverse engineer any software',
        copyright: 'remove any copyright or other proprietary notations',
        transfer: 'transfer the materials to another person'
      },
      userResponsibility: 'User Responsibilities',
      userResponsibilityContent: 'As a platform user, you are responsible for ensuring that your use complies with these terms and all applicable laws and regulations. You agree not to use this service for any illegal purposes or in any way that could damage, disable, overburden, or impair the service.',
      disclaimer: 'Disclaimer',
      disclaimerContent: 'The materials on MCP-X\'s website are provided on an \'as is\' basis. MCP-X makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement.',
      liability: 'Limitations',
      liabilityContent: 'In no event shall MCP-X or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MCP-X\'s website.',
      contactInfo: 'Contact Information',
      contactContent: 'If you have any questions about these Terms of Service, please contact us at',
      contactEmail: '.'
    },
    
    // Forgot password page
    forgotPassword: {
      title: 'Reset Password',
      emailStep: 'Please enter your email address and we will send you a verification code',
      codeStep: 'Verification code sent to {email}',
      passwordStep: 'Please set your new password',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Please enter your email',
      codeLabel: 'Verification Code',
      codePlaceholder: 'Please enter 6-digit code',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Please enter new password, at least 6 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Please enter new password again',
      sendCode: 'Send Code',
      sending: 'Sending...',
      verifyAndContinue: 'Verify and Continue',
      backToEmail: 'Back to Email',
      resetPassword: 'Reset Password',
      resetting: 'Resetting...',
      backToCode: 'Back to Code',
      rememberPassword: 'Remember your password? Back to login',
      enterEmail: 'Please enter email address',
      invalidEmail: 'Please enter a valid email format',
      enterCode: 'Please enter verification code',
      enterNewPassword: 'Please enter new password',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      codeSent: 'Verification code sent to your email',
      resetSuccess: 'Password reset successful, please login with your new password',
      sendCodeFailed: 'Failed to send verification code',
      resetFailed: 'Failed to reset password',
      noCodeReceived: 'Didn\'t receive the code?',
      resendAfter: 'Resend in {seconds}s',
      resend: 'Resend'
    },
    
    // GitHub callback page
    githubCallback: {
      processing: 'Processing GitHub login...',
      processingDesc: 'Please wait while we verify your GitHub account',
      loginFailed: 'GitHub Login Failed',
      loginSuccess: 'GitHub Login Successful',
      redirecting: 'Redirecting to homepage...',
      backToLogin: 'Back to Login',
      alreadyLoggedIn: 'You are already logged in',
      authorizationFailed: 'GitHub authorization failed, please try again',
      securityCheckFailed: 'Security check failed, please login again',
      invalidAccess: 'Invalid access, please login with GitHub again',
      loginError: 'An error occurred during GitHub login'
    },
    
    // Rewards page
    rewards: {
      title: 'Rewards Program',
      subtitle: 'Participate in MCP-X community building and earn generous point rewards',
      pointsExchange: 'Points can be exchanged for cash rewards later',
      rewardDescription: 'Reward Description',
      submitApplication: 'Submit Application',
      applyNow: 'Apply Now',
      rewardDetails: 'Reward Details',
      requirements: 'Requirements',
      pointsReward: 'Points Reward',
      
      // Reward types
      types: {
        blogger: {
          title: 'Blogger Promotion',
          points: '1000',
          description: 'Help us promote MCP-X on social platforms',
          details: {
            0: 'Publish any MCP-X related content on platforms like Bilibili, Xiaohongshu, etc.',
            1: 'Can be software tutorials, Q&A, usage experiences, etc.',
            2: 'Get 1000 points for the first original content, earn additional points based on views',
            3: 'Points can be exchanged for cash rewards later, exchange plan will be announced after points system goes live'
          },
          requirements: {
            0: 'Content must be original',
            1: 'Must include MCP-X related content',
            2: 'Provide publication link and platform screenshots',
            3: 'Content quality must meet platform recommendation standards'
          }
        },
        developer: {
          title: 'Development Contribution',
          points: 'By Contribution',
          description: 'Participate in MCP-X client open source development',
          details: {
            0: 'MCP-X client is a completely open source project',
            1: 'Welcome to submit PRs contributing code, documentation, tests, etc.',
            2: 'Get corresponding points based on PR quality and impact, exchange plan will be announced after points system goes live',
            3: 'Long-term contributors can get special rewards'
          },
          requirements: {
            0: 'Submitted PRs must pass code review',
            1: 'Code must meet project standards and quality requirements',
            2: 'Provide detailed PR descriptions and test instructions',
            3: 'Actively participate in community discussions and collaboration'
          }
        },
        tester: {
          title: 'Testing Feedback',
          points: '100',
          description: 'Help discover issues and provide improvement suggestions',
          details: {
            0: 'Bugs discovered while using MCP-X client',
            1: 'Propose product feature optimization suggestions',
            2: 'Get 100 points for each valid bug report or suggestion, exchange plan will be announced after points system goes live',
            3: 'Provide detailed reproduction steps and improvement solutions'
          },
          requirements: {
            0: 'Clear problem description with reproduction steps',
            1: 'Provide necessary screenshots or log information',
            2: 'Suggestions must be feasible and valuable',
            3: 'Avoid submitting duplicate issues'
          }
        }
      },
      
      // Form related
      form: {
        selectType: 'Select Submission Type',
        blogLink: 'Blog Link',
        blogLinkPlaceholder: 'Please enter the link to your published content',
        contentDescription: 'Content Description',
        contentDescriptionPlaceholder: 'Please briefly describe your published content, including platform, content type, estimated impact, etc.',
        githubLink: 'GitHub Fork Link',
        githubLinkPlaceholder: 'Please enter your GitHub Fork link and confirm you have submitted a PR',
        contributionDescription: 'Contribution Description',
        contributionDescriptionPlaceholder: 'Please describe your contribution in detail, including problems solved, new features added, code improvements, etc.',
        issueType: 'Issue Type',
        issueTypePlaceholder: 'Please select issue type',
        detailedDescription: 'Detailed Description',
        detailedDescriptionPlaceholder: 'Please describe the issue or suggestion in detail, including reproduction steps, expected results, actual results, etc.',
        contactInfo: 'Contact Information',
        contactInfoPlaceholder: 'Please enter your email or WeChat ID for us to contact you',
        contactInfoNote: 'Supports email, phone number (11 digits starting with 1) or WeChat ID (6-20 characters starting with letter)',
        charactersCount: 'characters',
        required: '*',
        submitting: 'Submitting...',
        submit: 'Submit Application',
        
        // Issue type options
        issueTypes: {
          bugReport: 'Bug Report',
          featureSuggestion: 'Feature Suggestion',
          performanceOptimization: 'Performance Optimization',
          uiImprovement: 'UI Improvement'
        }
      },
      
      // Points exchange info
      pointsExchangeInfo: {
        title: 'Points Exchange Information',
        pointsValue: '1000 Points',
        cashValue: '= ¥100 Cash (may be adjusted based on actual conditions)',
        minExchange: 'Minimum Exchange',
        minPoints: '500 points minimum',
        exchangeCycle: 'Exchange Cycle',
        exchangeDate: '15th of each month',
        notice: 'Points exchange feature will be available after the points system officially launches, stay tuned!',
        communityNote: 'Looking for those who can actively participate in MCP-X community building for the long term and jointly promote MCP-X development!',
        warning: 'Those looking for quick money, please stay away.'
      },
      
      // Login prompt
      loginRequired: {
        title: 'Login required to submit application',
        description: 'Please',
        loginText: 'login',
        afterLogin: 'first before submitting your rewards application'
      },
      
      // Messages
      messages: {
        loginFirst: 'Please login first before submitting application',
        submitSuccess: 'Submission successful! We will review your submission within 3 business days.',
        submitFailed: 'Submission failed:',
        networkError: 'Network error or server exception, please try again later.',
        
        // Validation errors
        validation: {
          contactRequired: 'Contact information cannot be empty',
          contactInvalid: 'Please enter a valid email address, phone number, or WeChat ID',
          descriptionRequired: 'Detailed description cannot be empty',
          descriptionTooShort: 'Detailed description must be at least 10 characters',
          descriptionTooLong: 'Detailed description cannot exceed 1000 characters',
          linkInvalid: 'Please enter a valid publication link (must start with http:// or https://)',
          githubLinkRequired: 'Please enter a valid GitHub link',
          githubLinkInvalid: 'Please enter a valid GitHub link (must start with http:// or https://)',
          issueTypeRequired: 'Please select issue type'
        }
      }
    },
    
    // Order page
    order: {
      title: 'My Orders',
      subtitle: 'View and manage all your orders',
      searchPlaceholder: 'Search order number or product name',
      search: 'Search',
      refresh: 'Refresh',
      loading: 'Loading...',
      noOrders: 'No orders found',
      continuePay: 'Continue Pay',
      table: {
        orderNo: 'Order No.',
        productName: 'Product Name',
        amount: 'Amount',
        payMethod: 'Payment Method',
        status: 'Status',
        createTime: 'Create Time',
        actions: 'Actions',
        view: 'View'
      },
      status: {
        pending: 'Pending',
        paid: 'Paid',
        cancelled: 'Cancelled',
        refunded: 'Refunded',
        unknown: 'Unknown'
      },
      payMethod: {
        wechat: 'WeChat Pay',
        alipay: 'Alipay',
        bankcard: 'Bank Card'
      },
      pagination: {
        prev: 'Previous',
        next: 'Next'
      }
    },
    
    // Balance page
    balance: {
      title: 'My Balance',
      subtitle: 'View your account balance and plan information',
      refresh: 'Refresh',
      loading: 'Loading...',
      currentBalance: 'Current Balance',
      availableBalance: 'Available Balance',
      lastUpdate: 'Last Update',
      currentPlan: 'Current Plan',
      planDescription: 'Your current service plan',
      planType: 'Plan Type',
      status: 'Status',
      active: 'Active',
      renewDate: 'Renewal Date',
      quickActions: 'Quick Actions',
      recharge: 'Recharge',
      rechargeDesc: 'Add funds to your account',
      upgrade: 'Upgrade Plan',
      upgradeDesc: 'Upgrade to a higher tier plan',
      viewOrders: 'View Orders',
      viewOrdersDesc: 'View your order history',
      usageStats: 'Usage Statistics',
      thisMonthSpent: 'This Month Spent',
      totalTransactions: 'Total Transactions',
      apiCalls: 'API Calls',
      plans: {
        free: 'Free',
        pro: 'Professional',
        vip: 'VIP',
        enterprise: 'Enterprise'
      }
    },
    
    // Settings page
    settings: {
      title: 'Settings',
      tabs: {
        profile: 'Profile',
        balance: 'My Balance',
        orders: 'My Orders',
        rewards: 'Rewards Program'
      },
      balance: {
        title: 'Balance Management'
      },
      orders: {
        title: 'Order Management',
        viewAll: 'View All Orders'
      }
    }
  }
};

export type TranslationKey = keyof typeof translations.zh;
export type NestedTranslationKey = string;
