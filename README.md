# Bozok Etkinlik — Kampüs Etkinlik Panosu

Kampüsteki atölye, söyleşi ve topluluk etkinliklerini listeleyen; tür ve başlığa
göre filtreleme, etkinlik önerisi formu ve yerel JSON API içeren bir web
uygulaması.

## Gereksinimler

- Node.js 18 veya üzeri
- Ek npm paketi gerekmez; sunucu Node.js'in yerleşik `http` modülünü kullanır.

## Çalıştırma

Proje klasöründe:

```powershell
npm.cmd start
```

Tarayıcıda `http://localhost:3000` adresini açın. Farklı bir port kullanmak
isterseniz `PORT` ortam değişkenini ayarlayın.

## Testler

Harici bağımlılık gerektirmeyen API, statik dosya ve etkinlik verisi testlerini
çalıştırın:

```powershell
npm.cmd test
```

Testler yerel bir test sunucusu başlatır ve tamamlanınca durdurur.

## API

| İstek | Başarılı yanıt |
| --- | --- |
| `GET /api/etkinlikler` | Etkinlik dizisi (JSON) |
| `GET /api/etkinlikler?tur=atolye` | Seçilen türdeki etkinlikler |
| `GET /api/etkinlikler/2` | Kimliği 2 olan etkinlik |

Bulunmayan bir etkinlik `404` ve `{"hata":"Etkinlik bulunamadı"}` döndürür.
Bulunmayan yollar `404`, `GET` dışındaki HTTP yöntemleri ise `405` ve `Allow:
GET` başlığı ile yanıtlanır. Tarayıcıya yalnızca `public/` içindeki dosyalar
sunulur; etkinlik verisi proje kökündeki `etkinlikler.json` dosyasından okunur.

Ödevde istenen dört API isteğini Windows'ta `curl.exe` ile sınayın:

```powershell
curl.exe -i "http://localhost:3000/api/etkinlikler?tur=atolye"
curl.exe -i "http://localhost:3000/api/etkinlikler/2"
curl.exe -i "http://localhost:3000/api/etkinlikler/999"
curl.exe -i -X DELETE "http://localhost:3000/api/etkinlikler/2"
```

## Proje yapısı

- `sunucu.js`: statik dosya sunucusu ve JSON API
- `etkinlikler.json`: örnek kampüs etkinlikleri
- `public/index.html`: semantik Türkçe sayfa iskeleti ve öneri formu
- `public/stil.css`: duyarlı yerleşim, kart ızgarası ve erişilebilir odak stilleri
- `public/betik.js`: API'den veri alma, kart oluşturma, filtreleme ve form
  doğrulama
- `test/`: Node.js yerleşik test çalıştırıcısıyla API, veri şeması ve erişilebilirlik kontrolleri
- `screenshots/`: uygulamadan alınmış masaüstü, mobil, filtre, form ve hata
  durumlarının ekran görüntüleri
- `rapor/`: kişisel bilgiler içerebileceği için Git'te izlenmeyen yerel rapor
  dosyaları

Etkinlik önerileri sunucuya kaydedilmez; yalnızca sayfa açıkken geçerli tarayıcı
oturumunun listesini günceller. Kalıcı kayıt için ayrıca bir yazma API'si ve
veri deposu gerekir.

## Ekran görüntüleri

| Dosya | Gösterilen durum |
| --- | --- |
| `screenshots/01-masaustu.png` | Masaüstü ana sayfa ve etkinlik panosu |
| `screenshots/02-mobil-390px.png` | 390 px telefon görünümü |
| `screenshots/03-filtre-ve-arama.png` | Atölye filtresiyle birlikte “git” araması |
| `screenshots/04-sonuc-yok.png` | Sonuç bulunamadığında gösterilen mesaj |
| `screenshots/05-api-hatasi.png` | API isteği başarısız olduğunda arayüz mesajı |
| `screenshots/06-form-dogrulama.png` | Boş form gönderiminde alan doğrulaması |
| `screenshots/07-oneri-basarili.png` | Geçerli öneriden sonra başarı mesajı |
| `screenshots/08-lighthouse-raporu.png` | Lighthouse mobil performans ve erişilebilirlik raporu |
| `screenshots/09-yukleniyor-3g.png` | 3G ağ emülasyonunda etkinlikler yüklenirken gösterilen durum |
| `screenshots/10-mobil-390px-viewport.png` | 390 px telefon görünümü ve etkinlik kartları |

`09-yukleniyor-3g.png`, Chrome'un 3G emülasyonu (150 ms gecikme, 204800 B/s
indirme ve 96000 B/s yükleme) kullanılarak alındı. Yükleniyor durumunu
görüntüleyebilmek için yalnızca ekran yakalaması sırasında yerel bir proxy API
yanıtını 1800 ms geciktirir; bu proxy uygulamanın parçası değildir.
`10-mobil-390px-viewport.png` yakalamasında görünüm ve belge genişlikleri
390 px'tir; yatay taşma gözlenmemiştir.

## Ödev raporu için teslim kontrolü

Bu ekran görüntüleri uygulama akışlarının ve teknik testlerin kanıtıdır.
Lighthouse erişilebilirlik ölçümü, `curl.exe` çıktı örnekleri ve 3G ağ
emülasyonundaki zamanlama kanıtı rapora eklenebilir.
Kapaktaki ad, öğrenci numarası ve GitHub bağlantısını kendiniz tamamlayın.
Ödev yönergesindeki yapay zekâ politikasına uyun ve kod desteği kullanımınızı
raporun beyan bölümünde doğru şekilde açıklayın.