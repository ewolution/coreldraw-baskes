# CorelDRAW · Baskes Payı (Taşma) Betiği

**Türkçe** | [English](README.en.md)

CorelDRAW'ın **içinde** çalışan JavaScript betiği. Magenta kesim çizgisiyle
üretilen işlerde, baskı ile kesim hafif kaydığında kenarda **beyaz kâğıt**
görünmesini engeller: asıl işin arkasına, kendi renginde **2 mm taşma** ekler.

Kesim çizgileri (CMYK **0/100/0/0**) baskıya girmez; betik onlara **hiç
dokunmaz** — kopyalamaz, kalınlaştırmaz, renk vermez.

```
       ┌─────────────────────────┐
       │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← 2 mm taşma (asıl işin rengi)
       │▒▒▒┌───────────────────┐▒▒│
       │▒▒▒│      asıl iş      │▒▒│  ← magenta kesim çizgisi burada
       │▒▒▒└───────────────────┘▒▒│
       │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
       └─────────────────────────┘
```

## Ne yapar?

- **Seçim varsa** yalnızca seçili nesnelere, **seçim yoksa** aktif sayfaya uygular.
- Grup içindeki her parçayı ayrı ele alır.
- **Kesim çizgilerini atlar**: magenta dolgulu parçalar ve dolgusuz magenta
  konturlar hiç kopyalanmaz (dosyada çift kesim yolu oluşmaz).
- **Düz renkli** parçalarda: kopyaya **4 mm kontur** (2 mm pay) verir, rengi
  dolgu rengidir.
- **Degradeli** parçalarda: taşma bandında **degrade devam eder** (aşağıya bakın).
- Kopyaları **`BLEED_`** ön ekiyle adlandırır, asıl nesnenin **hemen arkasına**
  koyar.
- Tüm işlem **tek `Ctrl+Z`** adımıdır; seçim işlem sonunda geri yüklenir.

## Kurulum

### Tek dosya (önerilen)

1. [Releases](https://github.com/ewolution/coreldraw-baskes/releases/latest)
   sayfasından **`Coreldraw-Baskes-Kur-vX.Y.Z.bat`** dosyasını indirin.
2. **Çift tıklayın.** Betik kendini açar ve `Baskes-Payi.js` dosyasını
   bilgisayardaki tüm CorelDRAW sürümlerinin `Draw\Scripts` klasörüne kopyalar.
3. **CorelDRAW'ı kapatıp yeniden açın** (açık işinizi kaydedin; liste yenilenene
   kadar betik görünmez).

### ZIP paketi

Release'teki ZIP'i açın → `Kur.bat` → CorelDRAW'ı yeniden başlatın.
Kaldırmak için `Kaldir.bat`.

### Elle

`Baskes-Payi.js` dosyasını şu klasöre kopyalayın:

```
%APPDATA%\Corel\CorelDRAW Graphics Suite 20xx\Draw\Scripts\
```

**Kontrol:** `Araçlar ▸ Komut Dosyaları ▸ Komut Dosyaları` (`Alt+Shift+F11`) →
**JavaScript ▸ User Scripts ▸ Baskes-Payi**

> Listede görünmezse Scripts panelindeki **Load** düğmesiyle yukarıdaki
> `Scripts` klasörünü bir kez gösterin.

## Kullanım

1. Taşma eklenecek nesneleri seçin (grup varsa **grubu** seçin).
2. `Alt+Shift+F11` → **Baskes-Payi** (çift tıklayın).
3. Sonuç penceresini kontrol edin.
4. Beğenmezseniz **`Ctrl+Z`**.

## Nasıl çalışıyor?

### 1. Kesim çizgisi kuralı

`0/100/0/0` (tam magenta) olan **her şey** kesim çizgisidir ve dokunulmaz:

| Durum | Davranış |
|---|---|
| Magenta **dolgulu** parça | Atlanır (kopya üretilmez) |
| **Dolgusuz** magenta kontur | Atlanır |
| Asıl iş + magenta kontur (aynı nesne) | Asıl işten taşma alınır; orijinaldeki magenta çizgi aynen kalır |

### 2. Düz renkli parçalar

Kopyanın konturu **payın iki katı** kalınlığa getirilir (2 mm pay → 4 mm
kontur). Kontur çizginin **ortasına** çizildiği için dışarıya tam **2 mm**
taşar; içeri giren yarısı asıl dolgunun altında kalır. Renk, dolgu rengidir ve
yazıldıktan sonra **geri okunarak doğrulanır** (magenta kontur asla bırakılmaz).

### 3. Degradeli parçalar

Sırayla üç yol denenir — bantta degrade korunur:

1. **Kontur efekti** (dışa 2 mm) — efekt nesnenin dolgusunu devralır.
2. **Halka yöntemi** — kontur efekti çalışmazsa: kopyanın 4 mm konturu
   **nesneye çevrilir** ve üzerine orijinal degrade **birebir kopyalanır**.
3. **Düz ortalama** — ikisi de olmazsa başlangıç/bitiş renginin CMYK ortalaması.

Sonuç penceresindeki `Degrade taşma: kontur efekti X · halka Y` satırı hangi
yolun kaç parçada kullanıldığını gösterir.

### 4. Kontur birimi

`Outline.Width` birimi CorelDRAW sürümüne göre mm ya da point olabiliyor.
Betik her çalışmada 1×1 mm'lik geçici bir dikdörtgenle bunu ölçer ve kalınlığı
ona göre uygular. Sonuç penceresinde **`Kontur birimi: mm`** görünür.

## Ayarlar

Dosyanın başındaki `AYAR` nesnesi (betiği düzenleyip kaydedin):

| Ayar | Varsayılan | Açıklama |
|---|---|---|
| `payMM` | `2.0` | Kesim çizgisi dışına eklenecek taşma (mm) |
| `kesimCmyk` | `[0, 100, 0, 0]` | Kesim rengi — bu renk **asla** işlenmez |
| `kesimTolerans` | `0.5` | Kesim rengi eşleşme toleransı (CMYK %) |
| `degradeKontur` | `true` | Degradede kontur efektini dene |
| `onek` | `"BLEED_"` | Kopyaların ad ön eki |

`payMM: 3.0` yazarsanız düz renklerde kontur otomatik 6 mm olur (dışarı 3 mm).

## Sonuç penceresi

```
Baskes Payi v1.0.0

Taşma payı eklendi.

Mod: seçili nesneler
Eklenen kopya: 90
Atlanan nesne: 0 (bunların 0 tanesi sadece kesim çizgisi)
Dolgu: düz 24 · degrade 66 · desteklenmeyen 0
Degrade taşma: kontur efekti 0 · halka 66
Pay: 2 mm (düz renkte kontur 4 mm)
Kontur birimi: mm

Kesim çizgilerine (CMYK 0/100/0/0) dokunulmadı.
Geri almak için: Ctrl+Z
```

## Sınırlar

- **Komşu nesnelere taşar.** Üstteki nesnenin 2 mm'lik bandı alttaki komşusunun
  üzerine biner; kesimde o bölge atıldığı için istenen davranıştır. Kesim dışı
  bir işte kullanmayın.
- **Bitmap / desen / doku / hatch** dolgular taşma almaz.
- **PowerClip** içeren nesneler atlanır.
- Grup içindeki tek bir parçayı değil, **grubu** seçin.
- **Kilitli katman** varsa önce kilidini açın.
- Aynı işi iki kez çalıştırırsanız ikinci bir kopya ekler; tek seferde çalıştırın.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| Betik listede yok | CorelDRAW'ı yeniden başlatın; olmazsa Scripts panelinde **Load** ile `...\Draw\Scripts` klasörünü gösterin |
| `Eklenen kopya: 0` | Seçimde dolgulu nesne yok ya da hepsi kesim renginde; asıl işi seçin |
| Bant tek renk | `Degrade taşma` satırında `kontur efekti` ve `halka` sıfırsa sürüm bu API'leri desteklemiyor demektir; pencere tanı satırını paylaşın |
| Eski kopyalar duruyor | `Ctrl+Z` ile geri alın; yeni çalıştırma `BLEED_` kopyalarını atlar |

## Sürüm geçmişi

- **1.0.0** — İlk sürüm: kesim çizgilerine dokunmadan taşma; düz renkte 4 mm
  kontur, degradede kontur efekti → halka → ortalama sırası; tek dosya kurulum.
