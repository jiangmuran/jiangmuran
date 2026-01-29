// 化学物质分类数据
const CHEMICAL_DATA = {
  // 纯净物 - 单质
  单质: [
    { name: 'O₂', fullName: '氧气', description: '氧气是单质，由同种元素组成的纯净物' },
    { name: 'H₂', fullName: '氢气', description: '氢气是单质，由同种元素组成的纯净物' },
    { name: 'N₂', fullName: '氮气', description: '氮气是单质，由同种元素组成的纯净物' },
    { name: 'Fe', fullName: '铁', description: '铁是单质，由同种元素组成的纯净物' },
    { name: 'Cu', fullName: '铜', description: '铜是单质，由同种元素组成的纯净物' },
    { name: 'Al', fullName: '铝', description: '铝是单质，由同种元素组成的纯净物' },
    { name: 'Zn', fullName: '锌', description: '锌是单质，由同种元素组成的纯净物' },
    { name: 'S', fullName: '硫', description: '硫是单质，由同种元素组成的纯净物' },
    { name: 'P', fullName: '磷', description: '磷是单质，由同种元素组成的纯净物' },
    { name: 'C', fullName: '碳', description: '碳是单质，由同种元素组成的纯净物' },
    { name: 'Cl₂', fullName: '氯气', description: '氯气是单质，由同种元素组成的纯净物' },
    { name: 'He', fullName: '氦气', description: '氦气是单质，由同种元素组成的纯净物' }
  ],
  
  // 纯净物 - 氧化物
  氧化物: [
    { name: 'H₂O', fullName: '水', description: '水是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'CO₂', fullName: '二氧化碳', description: '二氧化碳是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'CO', fullName: '一氧化碳', description: '一氧化碳是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'SO₂', fullName: '二氧化硫', description: '二氧化硫是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'SO₃', fullName: '三氧化硫', description: '三氧化硫是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'Fe₂O₃', fullName: '氧化铁', description: '氧化铁是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'Fe₃O₄', fullName: '四氧化三铁', description: '四氧化三铁是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'CuO', fullName: '氧化铜', description: '氧化铜是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'Al₂O₃', fullName: '氧化铝', description: '氧化铝是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'CaO', fullName: '氧化钙', description: '氧化钙是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'MgO', fullName: '氧化镁', description: '氧化镁是氧化物，由两种元素组成，其中一种是氧元素' },
    { name: 'ZnO', fullName: '氧化锌', description: '氧化锌是氧化物，由两种元素组成，其中一种是氧元素' }
  ],
  
  // 纯净物 - 酸
  酸: [
    { name: 'HCl', fullName: '盐酸', description: '盐酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'H₂SO₄', fullName: '硫酸', description: '硫酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'HNO₃', fullName: '硝酸', description: '硝酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'H₂CO₃', fullName: '碳酸', description: '碳酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'CH₃COOH', fullName: '醋酸', description: '醋酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'H₃PO₄', fullName: '磷酸', description: '磷酸是酸，在水溶液中电离出的阳离子全部是氢离子' },
    { name: 'H₂S', fullName: '氢硫酸', description: '氢硫酸是酸，在水溶液中电离出的阳离子全部是氢离子' }
  ],
  
  // 纯净物 - 碱
  碱: [
    { name: 'NaOH', fullName: '氢氧化钠', description: '氢氧化钠是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'Ca(OH)₂', fullName: '氢氧化钙', description: '氢氧化钙是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'KOH', fullName: '氢氧化钾', description: '氢氧化钾是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'Mg(OH)₂', fullName: '氢氧化镁', description: '氢氧化镁是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'Al(OH)₃', fullName: '氢氧化铝', description: '氢氧化铝是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'Fe(OH)₃', fullName: '氢氧化铁', description: '氢氧化铁是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'Cu(OH)₂', fullName: '氢氧化铜', description: '氢氧化铜是碱，在水溶液中电离出的阴离子全部是氢氧根离子' },
    { name: 'NH₃·H₂O', fullName: '氨水', description: '氨水是碱，在水溶液中电离出的阴离子全部是氢氧根离子' }
  ],
  
  // 纯净物 - 盐
  盐: [
    { name: 'NaCl', fullName: '氯化钠', description: '氯化钠是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'CaCO₃', fullName: '碳酸钙', description: '碳酸钙是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'Na₂CO₃', fullName: '碳酸钠', description: '碳酸钠是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'NaHCO₃', fullName: '碳酸氢钠', description: '碳酸氢钠是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'CuSO₄', fullName: '硫酸铜', description: '硫酸铜是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'FeSO₄', fullName: '硫酸亚铁', description: '硫酸亚铁是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'AgNO₃', fullName: '硝酸银', description: '硝酸银是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'KCl', fullName: '氯化钾', description: '氯化钾是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'BaCl₂', fullName: '氯化钡', description: '氯化钡是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' },
    { name: 'Na₂SO₄', fullName: '硫酸钠', description: '硫酸钠是盐，由金属离子（或铵根离子）和酸根离子组成的化合物' }
  ],
  
  // 混合物
  混合物: [
    { name: '空气', fullName: '空气', description: '空气是混合物，由多种物质组成' },
    { name: '海水', fullName: '海水', description: '海水是混合物，由多种物质组成' },
    { name: '石油', fullName: '石油', description: '石油是混合物，由多种物质组成' },
    { name: '天然气', fullName: '天然气', description: '天然气是混合物，由多种物质组成' },
    { name: '合金', fullName: '合金', description: '合金是混合物，由多种物质组成' },
    { name: '溶液', fullName: '溶液', description: '溶液是混合物，由多种物质组成' },
    { name: '牛奶', fullName: '牛奶', description: '牛奶是混合物，由多种物质组成' },
    { name: '糖水', fullName: '糖水', description: '糖水是混合物，由多种物质组成' },
    { name: '盐水', fullName: '盐水', description: '盐水是混合物，由多种物质组成' },
    { name: '泥土', fullName: '泥土', description: '泥土是混合物，由多种物质组成' }
  ]
};

// 分类层级关系
const CATEGORY_HIERARCHY = {
  '纯净物': ['单质', '氧化物', '酸', '碱', '盐'],
  '混合物': []
};

// 所有分类列表
const ALL_CATEGORIES = ['纯净物', '混合物', '单质', '氧化物', '酸', '碱', '盐'];

// 获取所有物质（扁平化）
function getAllChemicals() {
  const all = [];
  for (const category in CHEMICAL_DATA) {
    CHEMICAL_DATA[category].forEach(chemical => {
      all.push({
        ...chemical,
        category: category
      });
    });
  }
  return all;
}

// 根据分类获取物质
function getChemicalsByCategory(category) {
  return CHEMICAL_DATA[category] || [];
}

// 获取随机物质
function getRandomChemicals(category, count, excludeCategories = []) {
  const correctRaw = getChemicalsByCategory(category);
  // 确保正确选项也有category属性
  const correct = correctRaw.map(item => ({
    ...item,
    category: category
  }));
  const shuffled = [...correct].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // 获取干扰项
  const allChemicals = getAllChemicals();
  const wrong = allChemicals.filter(c => 
    c.category !== category && !excludeCategories.includes(c.category)
  );
  const shuffledWrong = [...wrong].sort(() => Math.random() - 0.5);
  
  return {
    correct: selected,
    wrong: shuffledWrong.slice(0, Math.min(2, shuffledWrong.length))
  };
}

