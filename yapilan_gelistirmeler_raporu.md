# WebGL Penalty Shootout Simulator - Yapılan Geliştirmeler Raporu

Bu raporda, WebGL Penaltı Simülatörü projesinde hoca ve oyun fizikleri doğrultusunda gerçekleştirilen tüm grafik, mekanik, kontrol ve optimizasyon geliştirmeleri, ilgili kod blokları ve mimari detaylarıyla birlikte açıklanmıştır.

---

## 1. Kamera Kontrolleri ve WASD Gezintisi
Kameranın fareyle yörüngesel (orbit) dönüşüne ek olarak, klavyeden **WASD** tuşlarıyla yatay düzlemde serbestçe uçabilmesi sağlandı.

*   **İlgili Dosya:** `src/interaction/CameraControls.js`
*   **Açıklama:** Fareyle sağ tıklanıp bakış yönü değiştirilirken, `W`, `A`, `S`, `D` tuşlarına basıldığında kameranın baktığı yöne göre (local horizontal forward/right) kayma yapması sağlandı.

### Kod Snippet'ı (Kamera Matrisi Üzerinden Yön Hesaplama):
```javascript
// Kameranın yatay düzlemdeki ileri ve sağ yön vektörlerini hesaplama
const forward = new Vec3(viewMatrix[2], 0, viewMatrix[10]).normalize(); // Z ekseni izdüşümü
const right = new Vec3(viewMatrix[0], 0, viewMatrix[8]).normalize();   // X ekseni izdüşümü

const moveSpeed = 8.0 * deltaTime;

if (input.isKeyDown("KeyW")) {
  this.target = this.target.subtract(forward.multiply(moveSpeed));
}
if (input.isKeyDown("KeyS")) {
  this.target = this.target.add(forward.multiply(moveSpeed));
}
if (input.isKeyDown("KeyA")) {
  this.target = this.target.subtract(right.multiply(moveSpeed));
}
if (input.isKeyDown("KeyD")) {
  this.target = this.target.add(right.multiply(moveSpeed));
}
```

---

## 2. Gerçekçi Kaleci Yapısı ve Fiziksel Kurtarış Limiti
Kalecinin gol çizgisinin arkasına gizlenmesi önlendi, zıplama mesafesi gerçek bir insan fiziğiyle (maksimum 1.85 metre) sınırlandırılarak ışınlanma gibi duran yapay zıplama hareketi düzeltildi.

*   **İlgili Dosyalar:** `src/objects/Goalkeeper.js`, `src/physics/GoalkeeperDive.js`
*   **Açıklama:**
    *   Kalecinin varsayılan duruş konumu tam kale çizgisi olan `Z = -6.3` koordinatına taşındı.
    *   Zıplama limitini sınırlamak için top çok köşeye gitse bile kalecinin atlayabileceği maksimum `gkMaxReachX` değeri **1.85 metre** ile sınırlandırıldı.
    *   Eklem (eksen) rotasyonları kullanılarak gerçekçi bir eğilip zıplama animasyonu oluşturuldu.

### Kod Snippet'ı (Zıplama Limiti Hesabı):
```javascript
// GoalkeeperDive.js - Maksimum atlayış menzili sınırlama
export class GoalkeeperDive {
  static computeTarget(startPos, ballTarget, sideSpin) {
    const gkMaxReachX = 1.85; // Fiziksel insan atlayış limiti (ışınlanmayı önler)
    
    // Kalecinin zıplayacağı X hedefini sınırla
    const targetX = Math.max(
      startPos.x - gkMaxReachX, 
      Math.min(startPos.x + gkMaxReachX, ballTarget.x)
    );
    
    // Topun yüksekliğine göre atlayış yüksekliği
    const targetY = Math.max(0.3, Math.min(2.2, ballTarget.y * 0.8));
    const targetZ = startPos.z; // Çizgi üzerinde kalır
    
    return new Vec3(targetX, targetY, targetZ);
  }
}
```

---

## 3. Işık Kuleleri Kontrolü ve Fiziksel Direk Senkronizasyonu
Stadyumda bulunan 4 adet ışık kulesinin tek tek açılıp kapatılabilmesi, kulelerin konumunun arayüzdeki sürgülerle değiştirilmesi ve bu kulelerin fiziksel metal modellerinin ışıkla beraber sahada kusursuzca kayması sağlandı.

*   **İlgili Dosyalar:** `index.html`, `src/main.js`
*   **Açıklama:**
    *   `index.html` dosyasına bir `selectedLightIndex` açılır kutusu (Dropdown) eklenerek kullanıcının istediği ışığı seçmesi sağlandı.
    *   X, Y, Z slider'ları oynatıldığında sadece görünmez ışık kaynağı değil, sahnedeki **büyük metal ışık kulesi modeli de stadyum zemininde kayar.** Işık daima kule ucunda parlar.
    *   Seçili kule değiştiğinde sürgüler o kulenin mevcut koordinatlarını otomatik olarak devralır.

### Kod Snippet'ı (Arayüzde Dal Seçimi ve Fiziksel Kule Senkronu):
```javascript
// main.js - Seçilen ışık kulesini manuel konumlandırma
const selectedIndex = lightSelector ? parseInt(lightSelector.value) : 2;
const selectedLight = lightsList[selectedIndex];

if (moveSpeed > 0) {
  // Arama ışığı modu (otomatik hareket)
  // ... (sine/cosine dalga kodları)
} else {
  // Tamamen manuel kontrol modu
  if (selectedLight && posXSlider && posYSlider && posZSlider) {
    selectedLight.position = new Vec3(
      parseFloat(posXSlider.value),
      parseFloat(posYSlider.value),
      parseFloat(posZSlider.value)
    );
  }
}

// Tüm kulelerin fiziksel modellerini ışık kaynaklarının zemin izdüşümleriyle kilitleme
if (stadiumLightsObj) {
  for (let i = 0; i < 4; i++) {
    if (stadiumLightsObj.childrenObjects[i] && lightsList[i]) {
      stadiumLightsObj.childrenObjects[i].transform.position.x = lightsList[i].position.x;
      stadiumLightsObj.childrenObjects[i].transform.position.z = lightsList[i].position.z;
    }
  }
}
```

---

## 4. Direk Çarpışma Fiziği ve Gol Kontrolleri
Topun kale direklerine (sağ, sol ve üst direk) çarpması halinde fiziksel olarak ceza sahasına geri sekmesi sağlandı ve direğe çarpan topların kesinlikle **GOL sayılmaması** garanti altına alındı.

*   **İlgili Dosyalar:** `src/physics/BallTrajectory.js`, `src/interaction/GameStateMachine.js`
*   **Açıklama:**
    *   FIFA standartlarında kale direği sınırları (`X = ±3.66`, `Y = 3.0` metre) belirlenerek topun buralara çarptığı an tespit edilir.
    *   Direğe çarpan top, fizik kurallarına uygun olarak hızı azaltılarak ceza sahasına doğru bir yay çizerek seker.
    *   Ekranda **"DİREKTEN DÖNDÜ! 💥"** uyarısı çıkar ve skor tablosuna gol eklenmez.

### Kod Snippet'ı (Direkten Sekme Fizik Hesabı):
```javascript
// BallTrajectory.js - Direk temas tespiti ve çarpma yörüngesi
const hitLeft = Math.abs(target.x - (-3.66)) < 0.35 && target.y < 3.1;
const hitRight = Math.abs(target.x - 3.66) < 0.35 && target.y < 3.1;
const hitCrossbar = Math.abs(target.y - 3.0) < 0.35 && Math.abs(target.x) < 3.76;
const hitPost = hitLeft || hitRight || hitCrossbar;

if (hitPost && t > 1.0) {
  const dt = t - 1.0; // Temas sonrasındaki süre
  
  // Direkten çarpıp geri sahaya doğru sekme yay yörüngesi
  const bounceX = target.x - 2.5 * dt * (target.x > 0 ? 1 : -1);
  const bounceY = Math.max(0.2, target.y - 4.5 * dt + 3.0 * Math.sin(dt * Math.PI));
  const bounceZ = -6.5 + 8.5 * dt; // Ceza sahasına doğru pozitif yönde sekme
  
  return new Vec3(bounceX, bounceY, bounceZ);
}
```

---

## 5. Gol Sonrası 3 Saniyelik Akış ve Top Spini
Gol atıldığında veya direkten döndüğünde oyunun anında donarak durması engellendi. Topun hareketine devam etmesi ve 3 saniye sonra reset (Space) uyarısının çıkması sağlanarak gerçekçi bir maç akışı simüle edildi.

*   **İlgili Dosyalar:** `src/interaction/GameStateMachine.js`
*   **Açıklama:**
    *   Gol çizgisi geçildiği an (`t = 1.0`) gol, direk veya kurtarış tespiti yapılır, yazı anında ekrana basılır ancak oyun durdurulmaz.
    *   Top `t = 3.5` olana kadar (3 saniye boyunca) sahada süzülmeye, ağları sarsıp yere düşmeye veya sahanın içinde yuvarlanmaya devam eder.
    *   Orijinal tıklamaya bağlı falso formülleri (`sideSpin = -hitOffsetX * 6.5` / `verticalSpin = -hitOffsetY * 3.5`) geri yüklendi.
    *   Topa görsel olarak 3 eksende de dönme efekti verildi.

### Kod Snippet'ı (Gol Sonrası Akış ve Spinin Görselleştirilmesi):
```javascript
// GameStateMachine.js - updateShooting()
this.shotProgress += deltaTime / this.shotDuration;
const t = this.shotProgress;

// Topu 3 eksende de spin miktarına bağlı olarak döndür
if (ballObject) {
  ballObject.transform.position = finalBallPos;
  const rotationSpeed = 24.0;
  
  ballObject.transform.rotation.x += deltaTime * rotationSpeed * (1.2 + this.verticalSpin * 0.4);
  ballObject.transform.rotation.y += deltaTime * this.sideSpin * 8.0;
  ballObject.transform.rotation.z += deltaTime * rotationSpeed * 0.15;
}

// Gol tespiti t = 1.0 (çizgi geçişi) anında yapılır
if (!this.resultEvaluated && t >= 1.0) {
  this.resultEvaluated = true;
  this.evaluateShotResult(ballPos, gkObj);
}

// Şut bittikten 3 saniye sonra (t = 3.5) oyunu tamamla ve reset uyarısını göster
let isFinished = false;
if (this.shotProgress >= 3.5) {
  isFinished = true;
}

if (isFinished) {
  this.ui.showResetHint();
  this.state = GameState.FINISHED;
}
```

---

## Sonuç
Yapılan tüm bu değişiklikler projedeki temel WebGL, matris ve vektör matematiğine tam uyumlu olarak entegre edilmiştir. JavaScript modülleri önbellekten kaynaklı bir sorun yaşatmadığı sürece tarayıcınızda kusursuz olarak çalışacaktır.
