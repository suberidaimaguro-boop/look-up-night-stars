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
 Aql:{src:'art/Aql.webp',flip:1,a:[['Tarazed',0.7049,0.4561],['Altair',0.6380,0.5104],['Alshain',0.5710,0.5646],['Theta Aql',0.3373,0.7576],['Eta Aql',0.3700,0.5774],['Delta Aql',0.4003,0.3238],['Al Thalimain Prior',0.0829,0.2049]]}
};
