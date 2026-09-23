(function (root) {
  'use strict';
  const collection = 'https://www.yoasobi-music.jp/hajimeteno/';
  const songs = [
    {id:'yoru',title:'夜に駆ける',zh:'向夜晚奔去',roman:'Yoru ni Kakeru',year:'2019',category:'novel',story:'タナトスの誘惑',author:'星野舞夜',tie:'短篇小說',note:'從一篇短篇小說開始，文字有了旋律，YOASOBI 的第一章也就此展開。',summary:'以星野舞夜的短篇小說為原作。可以先認識小說與歌曲的創作關係，再回到音樂，留意敘事視角如何改變聆聽的感受。',source:'https://cocotame.jp/series/019058/',sourceLabel:'Sony Music｜原作與歌曲的誕生',listen:'https://www.youtube.com/watch?v=x8VYWazR5mE',motif:'夜',color:'rose'},
    {id:'idol',title:'アイドル',zh:'偶像',roman:'Idol',year:'2023',category:'anime',story:'45510',author:'赤坂アカ',tie:'動畫《【我推的孩子】》片頭曲',note:'聚光燈之下，是偶像與觀看她的人。',summary:'動畫《【我推的孩子】》片頭曲。赤坂アカ為歌曲撰寫小說《45510》，讓舞台之外的視角與動畫中的偶像故事彼此呼應。',source:'https://youngjump.jp/oshinoko/novel_45510/',sourceLabel:'集英社｜歌曲與原作小說',listen:'https://www.youtube.com/watch?v=ZRtdQ81jPUQ',motif:'星',color:'wine'},
    {id:'yuusha',title:'勇者',zh:'勇者',roman:'Yuusha',year:'2023',category:'anime',story:'奏送',author:'木曾次郎／山田鐘人監修',tie:'動畫《葬送的芙莉蓮》片頭曲',note:'旅途落幕之後，才開始讀懂那些相處的時間。',summary:'歌曲連結動畫《葬送的芙莉蓮》，並以原作者山田鐘人監修的小說《奏送》為創作基礎。從音樂進入故事，重新看待旅途、記憶與時間。',source:'https://frieren-anime.jp/special/novel/',sourceLabel:'動畫官方｜原作小說《奏送》',listen:'https://www.youtube.com/watch?v=OIBODIPC_8Y',motif:'旅',color:'green'},
    {id:'shukufuku',title:'祝福',zh:'祝福',roman:'Shukufuku',year:'2022',category:'anime',story:'ゆりかごの星',author:'大河内一楼',tie:'動畫《機動戰士鋼彈 水星的魔女》片頭曲',note:'關於選擇，也關於走向自己的未來。',summary:'《機動戰士鋼彈 水星的魔女》的片頭曲，以大河内一楼撰寫的《ゆりかごの星》為原作。官方網站公開小說，提供另一個理解角色關係的入口。',source:'https://gundam-official.com/witch-from-mercury/music/novel/',sourceLabel:'動畫官方｜原作小說',listen:'https://www.youtube.com/watch?v=3eytpBOkOFA',motif:'宙',color:'blue'},
    {id:'mister',title:'ミスター',zh:'Mr.',roman:'Mister',year:'2022',category:'novel',story:'私だけの所有者',author:'島本理生',tie:'小說集《はじめての》',note:'在一封信裡，尋找情感與歸屬的形狀。',summary:'《はじめての》企劃第一首歌曲。原作透過機器人與擁有者的關係，書寫第一次喜歡上一個人的經驗。',source:collection,sourceLabel:'YOASOBI｜はじめての 官方企劃',listen:'https://www.youtube.com/watch?v=2-c0DFt6vK4',motif:'信',color:'ochre'},
    {id:'sukida',title:'好きだ',zh:'喜歡你',roman:'Sukida',year:'2022',category:'novel',story:'ヒカリノタネ',author:'森絵都',tie:'小說集《はじめての》',note:'告白之前，那些想重新說一次的話。',summary:'《はじめての》企劃第二首歌曲。森絵都以告白為題，描寫一段與過去相連的單戀。',source:collection,sourceLabel:'YOASOBI｜はじめての 官方企劃',listen:'https://www.youtube.com/watch?v=WQ6ePunO8uY',motif:'光',color:'rose'},
    {id:'umi',title:'海のまにまに',zh:'隨海的擺布',roman:'Umi no Manimani',year:'2022',category:'novel',story:'ユーレイ',author:'辻村深月',tie:'小說集《はじめての》',note:'海邊的一次相遇，讓夜晚有了不同的方向。',summary:'《はじめての》企劃第三首歌曲。原作以第一次離家出走為主題，從海邊車站與夜間的相遇展開。',source:collection,sourceLabel:'YOASOBI｜はじめての 官方企劃',listen:'https://www.youtube.com/watch?v=7G0ovtPqHnI',motif:'海',color:'blue'},
    {id:'seventeen',title:'セブンティーン',zh:'十七歲',roman:'Seventeen',year:'2023',category:'novel',story:'色違いのトランプ',author:'宮部みゆき',tie:'小說集《はじめての》',note:'另一個世界裡，是否住著另一種可能？',summary:'《はじめての》企劃第四首歌曲。原作圍繞平行世界，以及為了救出女兒而踏上旅途的父親。',source:collection,sourceLabel:'YOASOBI｜はじめての 官方企劃',listen:'https://www.youtube.com/watch?v=0yoM7ETNPIY',motif:'鏡',color:'wine'}
  ];
  songs.push(
    {
      id:'anoyume', title:'あの夢をなぞって', zh:'重現夢境', roman:'Ano Yume wo Nazotte', year:'2020', category:'novel',
      story:'夢の雫と星の花', author:'いしき蒼太', tie:'短篇小說《夢の雫と星の花》',
      note:'在夢與現實交會的地方，等待一句告白。',
      summary:'YOASOBI 的第二首歌曲，以いしき蒼太的《夢の雫と星の花》為原作。小說後來也改編為漫畫，讓同一段青春故事以文字、音樂與畫面呈現。',
      source:'https://prtimes.jp/main/html/rd/p/000002400.000001594.html', sourceLabel:'LINE MUSIC｜歌曲與原作介紹',
      listen:'https://www.youtube.com/watch?v=sAuEeM_6zpk', motif:'夢', color:'blue'
    },
    {
      id:'halzion', title:'ハルジオン', zh:'春紫菀', roman:'Halzion', year:'2020', category:'novel',
      story:'それでも、ハッピーエンド', author:'橋爪駿輝', tie:'ZONe IMMERSIVE SONG PROJECT',
      note:'整理過去，也為接下來的自己留一點空間。',
      summary:'以橋爪駿輝為合作企劃撰寫的《それでも、ハッピーエンド》為原作。這首歌曲是 YOASOBI 與 ZONe 音樂企劃的合作作品，從小說走向新的視聽表現。',
      source:'https://prtimes.jp/main/html/rd/p/000000054.000014577.html', sourceLabel:'Sony Music｜ハルジオン 發行公告',
      listen:'https://www.youtube.com/watch?v=kzdJkT4kp-A', motif:'花', color:'rose'
    },
    {
      id:'tabun', title:'たぶん', zh:'大概', roman:'Tabun', year:'2020', category:'novel',
      story:'たぶん', author:'しなの', tie:'「夜遊びコンテスト vol.1」大賞小說',
      note:'有些告別，藏在一句沒有說滿的話裡。',
      summary:'以しなの的同名小說為原作。作品從 YOASOBI 舉辦的小說徵選中脫穎而出；作者與團員的對談，也記錄了短篇文字如何轉化為另一種音樂敘事。',
      source:'https://book.asahi.com/article/13752493', sourceLabel:'朝日新聞｜原作者與 YOASOBI 對談',
      listen:'https://www.youtube.com/watch?v=8iuLXODzL04', motif:'朝', color:'ochre'
    },
    {
      id:'haruka', title:'ハルカ', zh:'遙', roman:'Haruka', year:'2020', category:'novel',
      story:'月王子', author:'鈴木おさむ', tie:'小說《月王子》',
      note:'陪伴的日常，也能成為值得珍藏的故事。',
      summary:'鈴木おさむ在與 YOASOBI 的廣播交流後，為他們撰寫小說《月王子》。歌曲〈ハルカ〉由這次相遇誕生，原作也公開於 monogatary.com。',
      source:'https://prtimes.jp/main/html/rd/p/000000045.000055377.html', sourceLabel:'The Orchard Japan｜ハルカ 原作公告',
      listen:'https://www.youtube.com/watch?v=vd3IlOjSUGQ', motif:'月', color:'wine'
    },
    {
      id:'encore', title:'アンコール', zh:'安可', roman:'Encore', year:'2021', category:'novel',
      story:'世界の終わりと、さよならのうた', author:'水上下波', tie:'小說集《夜に駆ける YOASOBI小説集》收錄原作',
      note:'在告別之前，還想再聽一次的聲音。',
      summary:'以水上下波的《世界の終わりと、さよならのうた》為原作。小說先收錄於 YOASOBI 小說集，歌曲後收錄於首張 EP《THE BOOK》，延續文字與音樂互相連結的閱讀方式。',
      source:'https://ototoy.jp/_/default/p/812801', sourceLabel:'OTOTOY｜アンコール 發行與原作資訊',
      listen:'https://www.youtube.com/watch?v=vcGbefQBvJ4', motif:'奏', color:'green'
    },
    {
      id:'kaibutsu', title:'怪物', zh:'怪物', roman:'Kaibutsu', year:'2021', category:'anime',
      story:'自分の胸に自分の耳を押し当てて', author:'板垣巴留', tie:'動畫《BEASTARS》第 2 期片頭曲',
      note:'聽見心裡的聲音，再決定如何走向世界。',
      summary:'《BEASTARS》第 2 期片頭曲。漫畫原作者板垣巴留為歌曲撰寫小說《自分の胸に自分の耳を押し当てて》，將作品的角色與世界觀交由 YOASOBI 轉化為音樂。',
      source:'https://bst-anime.com/sp/', sourceLabel:'BEASTARS 官方｜音樂與創作訪談',
      listen:'https://www.youtube.com/watch?v=dy90tA3TT1c', motif:'心', color:'wine'
    },
    {
      id:'suisei', title:'優しい彗星', zh:'溫柔的彗星', roman:'Yasashii Suisei', year:'2021', category:'anime',
      story:'獅子座流星群のままに', author:'板垣巴留', tie:'動畫《BEASTARS》第 2 期片尾曲',
      note:'夜空中的光，照見角色之間的牽絆。',
      summary:'與〈怪物〉同為《BEASTARS》第 2 期的主題音樂，這首歌擔任片尾曲。原作為板垣巴留撰寫的《獅子座流星群のままに》，從另一個角度延伸動畫的故事。',
      source:'https://bst-anime.com/sp/', sourceLabel:'BEASTARS 官方｜音樂與創作訪談',
      listen:'https://www.youtube.com/watch?v=VyvhvlYvRnc', motif:'彗', color:'blue'
    },
    {
      id:'sangenshoku', title:'三原色', zh:'三原色', roman:'Sangenshoku', year:'2021', category:'novel',
      story:'RGB', author:'小御門優一郎', tie:'ahamo 廣告歌曲',
      note:'各自走過的路，在重逢時交會成新的顏色。',
      summary:'以小御門優一郎的小說《RGB》為原作，並作為 ahamo 的廣告歌曲。品牌發布資料同時介紹小說與 YOASOBI 的創作訪談，讓歌曲裡的連結與重逢有了文字的起點。',
      source:'https://cdn.kyodonewsprwire.jp/prwfile/release/M102603/202103182425/_prw_OR1fl_pSO27X5r.pdf', sourceLabel:'NTT DOCOMO｜三原色與 RGB 企劃公告',
      listen:'https://www.youtube.com/watch?v=nhOhFOoURnE', motif:'彩', color:'rose'
    }
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = songs;
  else root.YoruSongs = songs;
})(typeof globalThis !== 'undefined' ? globalThis : this);
