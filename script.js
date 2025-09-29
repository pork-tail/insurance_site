const AUTHOR = {
  name: "Федак Іван Романович",
  group: "3",
  faculty: "ФЕМП",
  ticket: "Білет №8",
};

// Синхронізація авторства у футері (якщо є відповідні елементи)
(function syncAuthor(){
  const nameEl = document.getElementById('studentName');
  const groupEl = document.getElementById('studentGroup');
  if(nameEl) nameEl.textContent = AUTHOR.name;
  if(groupEl) groupEl.textContent = AUTHOR.group;
})();

/* ==================== Дані послуг ==================== */
const SERVICES = [
  {code:"auto", name:"Автострахування (OSAGO/КАСКО)", desc:"Захист авто, допомога на дорозі, підміна авто."},
  {code:"travel", name:"Туристичне страхування", desc:"Медичні витрати за кордоном, багаж, відміна/затримка рейсів."},
  {code:"property", name:"Страхування майна", desc:"Квартири, приватні будинки, офіси — пожежа, затоплення, крадіжка."},
  {code:"health", name:"Медичне страхування", desc:"Амбулаторія, стаціонар, ліки, профілактика."},
];

function renderServices(){
  const wrap = document.getElementById('servicesList');
  if(!wrap) return;
  wrap.innerHTML = SERVICES.map(s => `
    <div class="card feature">
      <span class="badge">${s.code.toUpperCase()}</span>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
    </div>
  `).join("");
}

/* ==================== Тарифи / коефіцієнти ==================== */
/* Річні ставки як частка від страхової суми (term/12 масштабує за місяцями) */
const BASE_RATE = {
  auto: 0.015,     // 1.5% / рік
  travel: 0.004,   // 0.4% / рік
  property: 0.006, // 0.6% / рік
  health: 0.008    // 0.8% / рік
};

const COEFFS = {
  // Знижки за франшизу: 5% → −15%, 10% → −30%
  deductible: { "0": 1.00, "5": 0.85, "10": 0.70 },
  driverAge: { "18-24": 1.20, "25-60": 1.00, "60+": 1.10 },
  region: { "kyiv":1.10, "oblast":1.00, "abroad":1.25 },
  travellers: { "1":1.00, "2":1.80, "3+":2.40 },
  propertyType: { "flat":1.00, "house":1.10, "office":1.25 },
};

/* ==================== Хелпери ==================== */
function byId(id){ return document.getElementById(id); }
function currency(num){ return new Intl.NumberFormat('uk-UA', {maximumFractionDigits:2}).format(num); }

/* ==================== Калькулятор ==================== */
function initCalculator(){
  onTypeChange();
  recalc();
}

function onTypeChange(){
  const type = byId('type').value;
  const box = byId('extraOptions');
  let html = "";

  if(type === "auto"){
    html = `
      <div class="row">
        <div>
          <label>Вік водія</label>
          <select id="driverAge" onchange="recalc()">
            <option>18-24</option>
            <option selected>25-60</option>
            <option>60+</option>
          </select>
        </div>
        <div>
          <label>Регіон експлуатації</label>
          <select id="region" onchange="recalc()">
            <option value="kyiv">Київ</option>
            <option value="oblast" selected>Область</option>
          </select>
        </div>
      </div>`;
  } else if(type === "travel"){
    html = `
      <div class="row">
        <div>
          <label>К-сть мандрівників</label>
          <select id="travellers" onchange="recalc()">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </div>
        <div>
          <label>Напрям</label>
          <select id="region" onchange="recalc()">
            <option value="abroad">Закордон</option>
            <option value="oblast" selected>Україна</option>
          </select>
        </div>
      </div>`;
  } else if(type === "property"){
    html = `
      <div class="row">
        <div>
          <label>Тип майна</label>
          <select id="propertyType" onchange="recalc()">
            <option value="flat" selected>Квартира</option>
            <option value="house">Будинок</option>
            <option value="office">Офіс</option>
          </select>
        </div>
        <div>
          <label>Регіон</label>
          <select id="region" onchange="recalc()">
            <option value="kyiv">Київ</option>
            <option value="oblast" selected>Область</option>
          </select>
        </div>
      </div>`;
  } else if(type === "health"){
    html = `
      <div class="row">
        <div>
          <label>К-сть застрахованих</label>
          <select id="travellers" onchange="recalc()">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3+">3+</option>
          </select>
        </div>
        <div>
          <label>Регіон</label>
          <select id="region" onchange="recalc()">
            <option value="kyiv">Київ</option>
            <option value="oblast" selected>Область</option>
          </select>
        </div>
      </div>`;
  }

  box.innerHTML = html;
  recalc();
}

function resetCalc(){
  byId('type').value = 'auto';
  byId('term').value = 12;
  byId('coverage').value = 200000;
  byId('deductible').value = "0";
  onTypeChange();
}

function recalc(){
  // Тип страхування: беремо і value, і текст (UA)
  const typeSel = byId('type');
  const type = typeSel.value;
  const typeText = typeSel.options[typeSel.selectedIndex].text;

  const term = Math.max(1, parseInt(byId('term').value||"1",10));
  const coverage = Math.max(10000, parseFloat(byId('coverage').value||"10000"));
  const deductible = byId('deductible').value;

  const rows = [];
  rows.push(["Тип", typeText]); // ✅ показуємо текст українською
  rows.push(["Термін (міс)", term]);
  rows.push(["Сума покриття (₴)", currency(coverage)]);
  rows.push(["Франшиза", deductible + "%"]);

  // БАЗА: відсоток від страхової суми за обраний термін
  let base = coverage * BASE_RATE[type] * (term / 12);
  let coeff = COEFFS.deductible[deductible];

  // Типо-специфічні поля + текст українською у результатах
  if(type === "auto"){
    const ageSel = byId('driverAge');
    const ageText = ageSel.options[ageSel.selectedIndex].text;

    const regionSel = byId('region');
    const regionVal = regionSel.value;
    const regionText = regionSel.options[regionSel.selectedIndex].text;

    coeff *= COEFFS.driverAge[ageSel.value] * COEFFS.region[regionVal];
    rows.push(["Вік водія", ageText]);
    rows.push(["Регіон", regionText]);

  } else if(type === "travel"){
    const travSel = byId('travellers');
    const travVal = travSel.value;
    const travText = travSel.options[travSel.selectedIndex].text;

    const regionSel = byId('region');
    const regionVal = regionSel.value;
    const regionText = regionSel.options[regionSel.selectedIndex].text;

    coeff *= COEFFS.travellers[travVal] * COEFFS.region[regionVal];
    rows.push(["Мандрівники", travText]);
    rows.push(["Напрям", regionText]);

  } else if(type === "property"){
    const propSel = byId('propertyType');
    const propVal = propSel.value;
    const propText = propSel.options[propSel.selectedIndex].text;

    const regionSel = byId('region');
    const regionVal = regionSel.value;
    const regionText = regionSel.options[regionSel.selectedIndex].text;

    coeff *= COEFFS.propertyType[propVal] * COEFFS.region[regionVal];
    rows.push(["Тип майна", propText]);
    rows.push(["Регіон", regionText]);

  } else if(type === "health"){
    const travSel = byId('travellers');
    const travVal = travSel.value;
    const travText = travSel.options[travSel.selectedIndex].text;

    const regionSel = byId('region');
    const regionVal = regionSel.value;
    const regionText = regionSel.options[regionSel.selectedIndex].text;

    coeff *= COEFFS.travellers[travVal] * COEFFS.region[regionVal];
    rows.push(["Застраховані", travText]);
    rows.push(["Регіон", regionText]);
  }

  const total = Math.max(250, base * coeff); // мінімальний платіж (можна змінити)
  const tbody = document.getElementById('quoteRows');
  if(tbody){
    tbody.innerHTML = rows.map(([k,v])=>`<tr><th>${k}</th><td>${v}</td></tr>`).join("");
  }
  const t = document.getElementById('totalPrice');
  if(t) t.textContent = currency(total);
}
