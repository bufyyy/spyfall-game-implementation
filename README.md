# 🕵️ Spyfall Türkçe

Modern, web tabanlı, çok oyunculu Spyfall oyunu. Sosyal kesinti oyunu - Kim casus?

## 🎮 Oyun Hakkında

Spyfall, oyuncuların arasındaki casusu bulmaya çalıştıkları sosyal kesinti oyunudur. Oyuncuların çoğu aynı lokasyonu bilirken, casus lokasyonu bilmez ve lokasyonu öğrenmeye çalışır.

### 📋 Oyun Kuralları

- **Oyuncu Sayısı:** 4-8 kişi
- **Süre:** 8 dakika
- **Amaç:** Casus olmayan oyuncular casusu bulmaya çalışır, casus ise lokasyonu öğrenmeye çalışır

### 🎯 Kazanma Koşulları

1. **Süre dolduğunda:** Casus yakalanmadıysa casus kazanır
2. **Oylama ile:** Tüm casus olmayan oyuncular oylayıp casusu bulursa vatandaşlar kazanır
3. **Casus tahmini:** Casus lokasyonu doğru tahmin ederse casus kazanır

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Kurulum

1. Projeyi klonlayın veya indirin
2. Bağımlılıkları yükleyin:

```bash
npm install
```

### Çalıştırma

**Geliştirme modunda:**
```bash
npm run dev
```

**Üretim modunda:**
```bash
npm start
```

Oyun `http://localhost:3000` adresinde çalışacaktır.

## 🎲 Nasıl Oynanır

### 1. Oda Oluşturma
- Ana sayfada "Oda Oluştur" butonuna tıklayın
- Oda kodu otomatik olarak oluşturulur
- Diğer oyuncular bu kodu kullanarak odaya katılabilir

### 2. Odaya Katılma
- Oda kodunu girin
- Adınızı girin (boş bırakırsanız otomatik ad verilir)
- "Odaya Katıl" butonuna tıklayın

### 3. Oyunu Başlatma
- Host (oda kurucusu) en az 4 oyuncu olduğunda oyunu başlatabilir
- "Oyunu Başlat" butonu yalnızca host'ta görünür

### 4. Oyun İçi
- **Casus değilseniz:** Lokasyonunuz kartınızda görünür
- **Casus iseniz:** "Sen Casussun!" mesajı görünür
- Sırayla sorular sorun ve cevap verin
- **Suçlama:** "Birini Suçla" butonuyla oylama başlatın
- **Casus Tahmini:** Casus iseniz "Lokasyonu Tahmin Et" butonunu kullanın

## 🗺️ Lokasyonlar

Oyunda 40 farklı Türkçe lokasyon bulunmaktadır:

- Hastane, Okul, Restoran, Kuaför, Sinema
- Kütüphane, Süpermarket, Benzin İstasyonu, Banka
- Postane, Eczane, Kahvehane, Spor Salonu
- Müze, Park, Plaj, Dağ Evi, Otobüs Durağı
- Havaalanı, Tren İstasyonu, Otel, Çiftlik
- Ve daha fazlası...

## 🛠️ Teknik Detaylar

### Teknolojiler

- **Backend:** Node.js, Express.js, Socket.IO
- **Frontend:** Vanilla JavaScript, CSS3, HTML5
- **Real-time Communication:** WebSocket (Socket.IO)

### Proje Yapısı

```
spyfall/
├── server.js              # Ana sunucu dosyası
├── package.json           # Proje bağımlılıkları
├── public/                # İstemci dosyaları
│   ├── index.html         # Ana HTML dosyası
│   ├── style.css          # Stil dosyası
│   └── script.js          # İstemci JavaScript kodu
└── README.md              # Bu dosya
```

### Özellikler

- ✅ Gerçek zamanlı çok oyunculu oyun
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Modern ve kullanıcı dostu arayüz
- ✅ Türkçe dil desteği
- ✅ Otomatik oda yönetimi
- ✅ 8 dakikalık oyun zamanlayıcısı
- ✅ Oylama sistemi
- ✅ Casus tahmin sistemi
- ✅ Host transfer (host ayrılırsa otomatik yeni host)

## 🎨 Ekran Görüntüleri

Oyun 4 ana ekrandan oluşur:

1. **Ana Menü:** Oda oluşturma ve katılma
2. **Bekleme Odası:** Oyuncuları bekleme ve oyunu başlatma
3. **Oyun Ekranı:** Ana oyun arayüzü
4. **Sonuç Ekranı:** Oyun sonucu ve tekrar oynama

## 🌐 Dağıtım

### Heroku'ya Dağıtım

1. Heroku CLI'yi yükleyin
2. Projeyi Heroku'ya gönderin:

```bash
heroku create spyfall-turkish
git add .
git commit -m "Initial commit"
git push heroku main
```

### Diğer Platformlar

Proje, Node.js destekleyen herhangi bir platformda çalışabilir:
- Vercel
- Netlify Functions
- AWS Lambda
- DigitalOcean App Platform

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorular veya öneriler için issue açabilirsiniz.

---

**Spyfall Türkçe** - İlk Türkçe web tabanlı Spyfall oyunu! 🇹🇷
