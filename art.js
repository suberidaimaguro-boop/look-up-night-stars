/* 星座絵(画像生成AIで作成した絵)。
   src: 画像(黒背景。黒は透明のように重ねる)
   flip: 1なら左右反転して重ねる
   a: [星のキー, 絵の中の横位置(0〜1), 縦位置(0〜1), 重み(省略時1)]
      絵の中でその星にあたる場所。実際の星の位置に合わせて、拡大・回転・移動して重ねる */
window.ART={
 Cyg:{src:'art/Cyg.webp',flip:0,a:[['Deneb',0.1994,0.6380,2],['Sadr',0.5104,0.5263,2],['Albireo',0.9450,0.3405,3],['Delta Cyg',0.3397,0.3589],['Gienah Cyg',0.7129,0.6539]]},
 Ori:{src:'art/Ori.webp',flip:0,a:[['Meissa',0.4992,0.1140],['Betelgeuse',0.3939,0.2289],['Bellatrix',0.6228,0.2057],['Alnitak',0.4394,0.3844],['Alnilam',0.4992,0.3772],['Mintaka',0.5582,0.3756],['Saiph',0.3844,0.7177],['Rigel',0.6180,0.7177]]},
 Sco:{src:'art/Sco.webp',flip:1,a:[['Antares',0.5494,0.5494],['Tau Sco',0.5989,0.5000],['Epsilon Sco',0.7424,0.3509],['Mu1 Sco',0.8150,0.2632],['Zeta2 Sco',0.8070,0.1332],['Eta Sco',0.7368,0.0630],['Sargas',0.6069,0.0781],['Iota Sco',0.5359,0.1515],['Kappa Sco',0.5470,0.1954],['Shaula',0.6045,0.2472],['Acrab',0.2743,0.5861],['Dschubba',0.5128,0.8054]]},
 Cas:{src:'art/Cas.webp',flip:0,a:[['Caph',0.8054,0.4761],['Schedar',0.6380,0.6061],['Navi',0.4944,0.4346],['Ruchbah',0.4147,0.5901],['Segin',0.1738,0.2743]]},
 Tau:{src:'art/Tau.webp',flip:0,a:[['Aldebaran',0.4466,0.4147,3],['Elnath',0.1116,0.3349,2],['Tianguan',0.0478,0.3748,2],['Lambda Tau',0.6619,0.5104],['Theta2 Tau',0.4856,0.4482],['Gamma Tau',0.5359,0.4362]]},
 UMa:{src:'art/UMa.webp',flip:0,a:[['Omicron UMa',0.9609,0.4099],['Dubhe',0.5494,0.2273],['Merak',0.5582,0.3349],['Phecda',0.3748,0.3509],['Megrez',0.3668,0.2632],['Alioth',0.2711,0.2951],['Mizar',0.1874,0.3349],['Alkaid',0.0877,0.4027],['Talitha',0.7049,0.7400],['Alula Australis',0.4394,0.7305],['Chi UMa',0.3541,0.5263],['Tania Australis',0.5909,0.7273],['Tania Borealis',0.6132,0.7033],['23 UMa',0.7703,0.3246],['Upsilon UMa',0.7233,0.4027],['Phi UMa',0.7161,0.4984],['Theta UMa',0.7703,0.5463],['Kappa UMa',0.8684,0.6292]]},
 Leo:{src:'art/Leo.webp',flip:0,a:[['Regulus',0.7656,0.6220],['Eta Leo',0.7855,0.5582],['Algieba',0.7177,0.4306],['Rasalas',0.7496,0.3190],['Algenubi',0.7974,0.2791],['Zosma',0.3030,0.4147],['Denebola',0.3644,0.1994],['Chertan',0.4466,0.5502]]},
 Peg:{src:'art/Peg.webp',flip:0,a:[['Enif',0.7974,0.4402],['Homam',0.6499,0.5550],['Markab',0.5742,0.6140],['Scheat',0.4362,0.4801],['Alpheratz',0.2887,0.6093],['Matar',0.4537,0.4139]]},
 Lyr:{src:'art/Lyr.webp',flip:0,a:[['Vega',0.5582,0.1834],['Sulafat',0.4785,0.6619],['Sheliak',0.6380,0.6619],['Zeta Lyr',0.5207,0.3030],['Epsilon2 Lyr',0.4545,0.1722],['Delta2 Lyr',0.4195,0.4155]]},
 Aql:{src:'art/Aql.webp',flip:1,a:[['Tarazed',0.7049,0.4561],['Altair',0.6380,0.5104],['Alshain',0.5710,0.5646],['Theta Aql',0.3373,0.7576],['Eta Aql',0.3700,0.5774],['Delta Aql',0.4003,0.3238],['Al Thalimain Prior',0.0829,0.2049]]},
 Gem:{src:'art/Gem.webp',flip:1,a:[['Castor',0.3850,0.1100,2],['Mebsuta',0.4000,0.6600],['Tejat',0.3850,0.9050],['Propus',0.3100,0.9450],['Pollux',0.6000,0.0900,2],['Wasat',0.6050,0.3800],['Alhena',0.7000,0.9250]]},
 CMa:{src:'art/CMa.webp',flip:1,a:[['Sirius',0.2500,0.3600,2],['Mirzam',0.0600,0.5500],['Wezen',0.5000,0.4200],['Adhara',0.6200,0.5500],['Aludra',0.7200,0.4000]]},
 CMi:{src:'art/CMi.webp',flip:1,a:[['Gomeisa',0.3500,0.1500],['Procyon',0.6000,0.4200,2]]},
 Aur:{src:'art/Aur.webp',flip:0,a:[['Capella',0.57,0.28,2],['Menkalinan',0.42,0.19],['Mahasim',0.30,0.41],['Hassaleh',0.57,0.66],['Elnath',0.43,0.66]]},
 Vir:{src:'art/Vir.webp',flip:1,a:[['Spica',0.36,0.17,2],['Porrima',0.56,0.20],['Vindemiatrix',0.74,0.46],['Zavijava',0.70,0.11],['Heze',0.50,0.35]]},
 Sgr:{src:'art/Sgr.webp',flip:1,a:[['Kaus Borealis',0.27,0.045],['Kaus Media',0.14,0.255],['Kaus Australis',0.235,0.47],['Alnasl',0.05,0.225],['Nunki',0.50,0.24],['Phi Sgr',0.42,0.27],['Ascella',0.40,0.33],['Pi Sgr',0.43,0.17],['Rukbat',0.74,0.58],['Arkab Prior',0.52,0.88],['Eta Sgr',0.17,0.68]]},
 Per:{src:'art/Per.webp',flip:0,a:[['Gamma Per',0.4346,0.1635,2],['Lambda Per',0.2671,0.0957],['Theta Per',0.7416,0.1994],['Zeta Per',0.3509,0.9330],['Omicron Per',0.6858,0.9171],['Mirfak',0.4785,0.3349],['Menkib',0.3748,0.8517],['Epsilon Per',0.3445,0.6866],['Nu Per',0.4107,0.5646],['Delta Per',0.3708,0.3612],['Psi Per',0.4075,0.3341],['Tau Per',0.5925,0.0718],['Iota Per',0.5566,0.2225],['Kappa Per',0.6236,0.3979]]},
 And:{src:'art/And.webp',flip:0,a:[['Alpheratz',0.4984,0.0797,2],['Delta And',0.4944,0.2871],['Mirach',0.4864,0.5183,2],['Almach',0.4147,0.9410,2],['Zeta And',0.7544,0.2344],['Epsilon And',0.5805,0.2568],['Pi And',0.4514,0.3158],['Mu And',0.3756,0.5016]]}
};
