(() => {
  "use strict";

  //configs
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const categories = {
    limpeza: { name: "Limpeza", icon: "clean", color: "" },
    jardinagem: { name: "Jardinagem", icon: "leaf", color: "green" },
    reparos: { name: "Pequenos reparos", icon: "tool", color: "blue" },
    pintura: { name: "Pintura", icon: "paint", color: "peach" },
    montagem: { name: "Montagem", icon: "box", color: "blue" },
  };
  const statuses = {
    pending: "Aguardando resposta",
    accepted: "Aceito",
    completed: "Concluído",
    cancelled: "Cancelado",
    declined: "Recusado",
  };
  const examples = [
    [
      "marina",
      "Marina Costa",
      "Rondonia",
      "Porto Velho",
      "limpeza",
      "Limpeza de casa",
      "Limpeza residencial com atenção aos detalhes, organização dos ambientes e cuidado com cada cantinho. Atendo casas e apartamentos; os materiais são combinados antes do serviço.",
      15000,
      "diária",
    ],
    [
      "carlos",
      "Carlos Almeida",
      "Manaus",
      "Flores",
      "jardinagem",
      "Seu jardim cheio de vida.",
      "Poda, manutenção de plantas, limpeza de canteiros e cuidado com pequenos jardins. Me conte o tamanho do espaço e o que suas plantas precisam para combinarmos o serviço.",
      12000,
      "serviço",
    ],
    [
      "marcos",
      "Marcos Benício",
      "Ji-Paraná",
      "Parque 10",
      "reparos",
      "Aqueles reparos que fazem a diferença.",
      "Instalação de prateleiras, ajuste de portas e pequenos reparos domésticos. Materiais combinados à parte. Não inclui intervenções em rede elétrica ou gás.",
      8000,
      "hora",
    ],
    [
      "juliana",
      "Juliana Oliveira",
      "São Paulo",
      "Vila Mariana",
      "pintura",
      "Uma nova cor para a sua casa.",
      "Pintura interna com preparação das superfícies e proteção dos móveis. Atendimento cuidadoso do começo à limpeza final. Tintas e materiais são combinados no orçamento.",
      22000,
      "diária",
    ],
    [
      "rafael",
      "Rafael Lima",
      "Manaus",
      "Dom Pedro",
      "montagem",
      "Do manual ao móvel pronto.",
      "Montagem de mesas, estantes, cômodas e outros móveis conforme o manual do fabricante. Informe o modelo e as dimensões para receber um orçamento adequado.",
      10000,
      "serviço",
    ],
    [
      "ana",
      "Ana Martins",
      "São Paulo",
      "Pinheiros",
      "limpeza",
      "Seu apartamento em boas mãos.",
      "Limpeza de apartamentos, pisos, superfícies e banheiros. Trabalho com pontualidade e cuidado com os seus objetos. Combine a quantidade de cômodos antes da visita.",
      17000,
      "diária",
    ],
  ];

  const state = {
    data: null,
    selectedProfessional: null,
    professionals: [],
    category: "",
    profile: null,
    dashboard: null,
    routeSequence: 0,
  };
  const money = (cents) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: cents % 100 ? 2 : 0,
    }).format(cents / 100);
  const formatDate = (date) =>
    new Intl.DateTimeFormat("pt-BR").format(
      new Date(typeof date === "string" ? `${date}T12:00:00` : date),
    );
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const initials = (name) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
  const avatar = (professional) =>
    `<span class="avatar avatar-${categories[professional.category]?.color || ""}" aria-hidden="true">${esc(initials(professional.name))}</span>`;
  const categoryLabel = (category) =>
    `<span class="category-label">${icon(categories[category].icon)}${categories[category].name}</span>`;
  const rating = (pro) =>
    pro.review_count
      ? `<span class="rating"><span class="star" aria-hidden="true">★</span><strong>${Number(pro.rating).toFixed(1).replace(".", ",")}</strong> <span class="rating-count">(${pro.review_count} avaliações)</span></span>`
      : '<span class="rating muted">Ainda sem avaliações</span>';
  const empty = (title, description, action = "") =>
    `<div class="empty-state">${icon("clean")}<h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;
  let toastTimeout;
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      $("#toast").hidden = true;
    }, 5000);
  }
  function setError(message) {
    $("#global-error").textContent = message;
    $("#global-error").hidden = !message;
  }
  function openDialog(id) {
    $(id).showModal();
    document.body.classList.add("modal-open");
  }
  function closeDialog(dialog) {
    dialog.close();
    document.body.classList.remove("modal-open");
  }

  //dados locais
  const STORAGE_KEY = "zelo-static-v1";
  let memoryOnly = false;
  function createExampleData() {
    const professionals = [];
    const reviews = [];
    examples.forEach(
      (
        [id, name, city, neighborhood, category, title, bio, price_cents, unit],
        index,
      ) => {
        const professional_id = `example-${id}`;
        const created_at = Date.UTC(2026, 8, 10 + index);
        professionals.push({
          id: professional_id,
          name,
          city,
          neighborhood,
          category,
          title,
          bio,
          price_cents,
          unit,
          is_example: true,
          created_at,
        });
        [
          [
            "Beatriz",
            5,
            "Muito cuidado com os detalhes. O serviço ficou como eu esperava e o atendimento foi ótimo.",
          ],
          [
            "Henrique",
            index % 2 ? 4 : 5,
            "Chegou no horário combinado e deixou tudo organizado ao terminar. Recomendo!",
          ],
        ].forEach(([customer_name, rating, comment], i) =>
          reviews.push({
            id: `${professional_id}-${i}`,
            professional_id,
            customer_name,
            rating,
            comment,
            is_example: true,
            created_at,
          }),
        );
      },
    );
    return { version: 1, professionals, requests: [], reviews };
  }
  function storageWarning(message) {
    $("#storage-warning").textContent = message;
    $("#storage-warning").hidden = !message;
  }
  function validSavedData(data) {
    return (
      data?.version === 1 &&
      Array.isArray(data.professionals) &&
      data.professionals.length > 0 &&
      Array.isArray(data.requests) &&
      Array.isArray(data.reviews) &&
      data.professionals.every(
        (p) =>
          typeof p.id === "string" &&
          /^[a-zA-Z0-9-]+$/.test(p.id) &&
          typeof p.name === "string" &&
          typeof p.bio === "string" &&
          typeof p.title === "string" &&
          typeof p.city === "string" &&
          typeof p.neighborhood === "string" &&
          Object.hasOwn(categories, p.category) &&
          Number.isFinite(p.price_cents) &&
          ["diária", "hora", "serviço"].includes(p.unit),
      ) &&
      data.requests.every(
        (r) =>
          typeof r.id === "string" &&
          typeof r.professional_id === "string" &&
          data.professionals.some((p) => p.id === r.professional_id) &&
          Object.hasOwn(statuses, r.status) &&
          typeof r.customer_name === "string" &&
          typeof r.notes === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
          Number.isFinite(r.price_cents),
      ) &&
      data.reviews.every(
        (r) =>
          typeof r.id === "string" &&
          typeof r.comment === "string" &&
          typeof r.customer_name === "string" &&
          Number.isInteger(r.rating) &&
          r.rating >= 1 &&
          r.rating <= 5,
      )
    );
  }
  function readLocalData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createExampleData();
      const parsed = JSON.parse(raw);
      if (!validSavedData(parsed)) throw new Error("Dados locais inválidos");
      return parsed;
    } catch {
      memoryOnly = true;
      storageWarning(
        "Não foi possível abrir os dados salvos. Você pode usar esta demonstração, mas as alterações ficarão apenas nesta aba.",
      );
      return createExampleData();
    }
  }
  function commitChange(change) {
    // Atualiza a cópia local
    let current = state.data;
    if (!memoryOnly) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (validSavedData(parsed)) current = parsed;
        }
      } catch {
        memoryOnly = true;
      }
    }
    const draft = JSON.parse(JSON.stringify(current));
    const result = change(draft);
    if (!memoryOnly) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        memoryOnly = true;
      }
    }
    if (memoryOnly)
      storageWarning(
        "Seu navegador não permitiu salvar os dados. As alterações desta demonstração duram somente enquanto esta aba estiver aberta.",
      );
    state.data = draft;
    return result;
  }
  function newId() {
    return (
      globalThis.crypto?.randomUUID?.() ||
      `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    );
  }
  function getProfessionals() {
    return state.data.professionals.map((pro) => {
      const reviews = state.data.reviews.filter(
        (review) => review.professional_id === pro.id,
      );
      return {
        ...pro,
        review_count: reviews.length,
        rating: reviews.length
          ? reviews.reduce((total, review) => total + review.rating, 0) /
            reviews.length
          : null,
      };
    });
  }
  function getRequests(professionalId) {
    return state.data.requests
      .filter(
        (order) => !professionalId || order.professional_id === professionalId,
      )
      .map((order) => ({
        ...order,
        professional_name:
          state.data.professionals.find(
            (pro) => pro.id === order.professional_id,
          )?.name || "Profissional",
        review_id: state.data.reviews.find(
          (review) => review.request_id === order.id,
        )?.id,
      }))
      .sort((a, b) => b.created_at - a.created_at);
  }
  function getReviews(professionalId) {
    return state.data.reviews
      .filter((review) => review.professional_id === professionalId)
      .sort((a, b) => b.created_at - a.created_at);
  }
  function requiredText(value, min, max, label) {
    const content = String(value || "").trim();
    if (content.length < min || content.length > max)
      throw new Error(`${label}: use entre ${min} e ${max} caracteres.`);
    return content;
  }
  function profileData(body) {
    const price = Math.round(
      Number(String(body.price).replace(",", ".")) * 100,
    );
    if (!Number.isFinite(price) || price < 100 || price > 10000000)
      throw new Error("Informe um valor entre R$ 1 e R$ 100.000.");
    if (
      !Object.hasOwn(categories, body.category) ||
      !["diária", "hora", "serviço"].includes(body.unit)
    )
      throw new Error("Escolha uma categoria e uma unidade válidas.");
    return {
      name: requiredText(body.name, 2, 80, "Nome"),
      city: requiredText(body.city, 2, 60, "Cidade"),
      neighborhood: requiredText(body.neighborhood, 2, 60, "Bairro"),
      category: body.category,
      title: requiredText(body.title, 5, 90, "Título"),
      bio: requiredText(body.bio, 20, 1500, "Descrição"),
      price_cents: price,
      unit: body.unit,
    };
  }
  function saveRequest(body) {
    const date = String(body.date);
    const parsed = new Date(`${date}T12:00:00Z`);
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date ||
      date < today.toISOString().slice(0, 10)
    )
      throw new Error("Escolha uma data válida a partir de hoje.");
    if (!["Manhã", "Tarde", "Noite"].includes(body.period))
      throw new Error("Escolha um período válido.");
    const name = requiredText(body.customer_name, 2, 80, "Nome");
    const contact = requiredText(
      body.customer_email,
      5,
      160,
      "E-mail de contato",
    );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact))
      throw new Error("Informe um e-mail de contato válido.");
    const notes = requiredText(body.notes, 10, 1000, "Descrição");
    commitChange((data) => {
      const pro = data.professionals.find((p) => p.id === body.professional_id);
      if (!pro) throw new Error("Este profissional não está no catálogo.");
      if (
        data.requests.some(
          (r) =>
            r.professional_id === pro.id &&
            r.date === date &&
            r.period === body.period &&
            ["pending", "accepted"].includes(r.status),
        )
      )
        throw new Error(
          "Você já tem um pedido para esse profissional, data e período.",
        );
      data.requests.unshift({
        id: newId(),
        professional_id: pro.id,
        customer_name: name,
        customer_email: contact,
        date,
        period: body.period,
        notes,
        service_title: pro.title,
        price_cents: pro.price_cents,
        unit: pro.unit,
        status: "pending",
        created_at: Date.now(),
      });
    });
  }
  function updateRequest(id, status) {
    const allowed = {
      accepted: ["pending"],
      declined: ["pending"],
      completed: ["accepted"],
      cancelled: ["pending", "accepted"],
    };
    commitChange((data) => {
      const order = data.requests.find((order) => order.id === id);
      if (!order || !allowed[status]?.includes(order.status))
        throw new Error("Este pedido já foi atualizado. Confira sua situação.");
      order.status = status;
    });
  }
  function saveReview(body) {
    const value = Number(body.rating);
    const comment = requiredText(body.comment, 5, 1000, "Comentário");
    if (!Number.isInteger(value) || value < 1 || value > 5)
      throw new Error("Escolha uma nota de 1 a 5.");
    commitChange((data) => {
      const order = data.requests.find((order) => order.id === body.request_id);
      if (!order || order.status !== "completed")
        throw new Error("Conclua o serviço no painel antes de avaliar.");
      if (data.reviews.some((review) => review.request_id === order.id))
        throw new Error("Este pedido já recebeu uma avaliação.");
      data.reviews.unshift({
        id: newId(),
        request_id: order.id,
        professional_id: order.professional_id,
        customer_name: order.customer_name.split(/\s+/)[0],
        rating: value,
        comment,
        is_example: false,
        created_at: Date.now(),
      });
    });
  }

  //CAMPOS REUTILIZÁVEIS
  function profileFields(professional = {}) {
    return `<label class="full">Nome profissional<input name="name" value="${esc(professional.name)}" autocomplete="name" required minlength="2" maxlength="80" placeholder="Como seus clientes conhecem você"></label>
    <label>Cidade<input name="city" value="${esc(professional.city)}" autocomplete="address-level2" required minlength="2" maxlength="60" placeholder="Ex.: Manaus"></label>
    <label>Bairro<input name="neighborhood" value="${esc(professional.neighborhood)}" required minlength="2" maxlength="60" placeholder="Ex.: Flores"></label>
    <label class="full">Serviço que você oferece<select name="category" required>${Object.entries(
      categories,
    )
      .map(
        ([key, value]) =>
          `<option value="${key}" ${key === professional.category ? "selected" : ""}>${value.name}</option>`,
      )
      .join("")}</select></label>
    <label class="full">Título do seu serviço<input name="title" value="${esc(professional.title)}" required minlength="5" maxlength="90" placeholder="Ex.: limpeza cuidadosa de casas e apartamentos"></label>
    <label>Valor inicial (R$)<input name="price" type="number" min="1" max="100000" step="0.01" value="${professional.price_cents ? (professional.price_cents / 100).toFixed(2) : ""}" required inputmode="decimal" placeholder="150,00"></label>
    <label>Cobrança por<select name="unit" required>${["diária", "hora", "serviço"].map((unit) => `<option value="${unit}" ${unit === professional.unit ? "selected" : ""}>${unit}</option>`).join("")}</select></label>
    <label class="full">Sobre você e seu serviço<textarea name="bio" required minlength="20" maxlength="1500" rows="4" placeholder="Conte sua experiência, o que está incluído e como você atende.">${esc(professional.bio)}</textarea></label>`;
  }
  $("#offer-fields").innerHTML = profileFields();
  async function submitForm(event, handler) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = $("[type=submit]", form);
    const error = $(".form-error", form);
    const label = button.innerHTML;
    error.hidden = true;
    button.disabled = true;
    button.textContent = "Aguarde…";
    try {
      await handler(Object.fromEntries(new FormData(form)), form);
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
      error.scrollIntoView({ block: "nearest" });
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  }

  //CATÁLOGO E PERFIL
  function renderCatalog() {
    const query = normalize($("#search-query").value);
    const city = $("#search-city").value;
    let found = state.professionals.filter(
      (pro) =>
        (!state.category || pro.category === state.category) &&
        (!city || pro.city === city) &&
        (!query ||
          normalize(
            `${pro.name} ${pro.title} ${pro.bio} ${categories[pro.category].name}`,
          ).includes(query)),
    );
    const sort = $("#search-sort").value;
    found.sort((a, b) =>
      sort === "price"
        ? a.price_cents - b.price_cents
        : sort === "recent"
          ? b.created_at - a.created_at
          : Number(b.rating || 0) - Number(a.rating || 0),
    );
    $("#results-count").textContent =
      `${found.length} ${found.length === 1 ? "profissional disponível" : "profissionais disponíveis"}${city ? ` em ${city}` : " para você conhecer"}`;
    $("#catalog-empty").hidden = Boolean(found.length);
    $("#professionals-grid").innerHTML = found
      .map(
        (pro) =>
          `<article class="professional-card"><div class="card-body"><div class="card-top">${categoryLabel(pro.category)}${pro.is_example ? '<span class="badge badge-example">Exemplo</span>' : '<span class="badge">Profissional</span>'}</div><div class="person-row">${avatar(pro)}<div class="person-meta"><h3>${esc(pro.name)}</h3><span class="location">${icon("pin")}${esc(pro.neighborhood)} · ${esc(pro.city)}</span></div></div><div><h4 class="card-title">${esc(pro.title)}</h4><p class="card-description">${esc(pro.bio.length > 125 ? `${pro.bio.slice(0, 122)}…` : pro.bio)}</p></div><div class="card-rating-row">${rating(pro)}</div></div><div class="card-footer"><span class="price"><span class="price-label">A partir de</span>${money(pro.price_cents)} <small>/ ${esc(pro.unit)}</small></span><a class="button profile-button" href="#perfil/${encodeURIComponent(pro.id)}" aria-label="Ver perfil de ${esc(pro.name)}">Ver perfil ${icon("arrow")}</a></div></article>`,
      )
      .join("");
    return found;
  }
  async function loadCatalog() {
    const selectedCity = $("#search-city").value;
    state.professionals = getProfessionals();
    const cities = [
      ...new Set(state.professionals.map((pro) => pro.city)),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
    $("#search-city").innerHTML =
      '<option value="">Todas as cidades</option>' +
      cities
        .map((city) => `<option value="${esc(city)}">${esc(city)}</option>`)
        .join("");
    $("#search-city").value = cities.includes(selectedCity) ? selectedCity : "";
    renderCatalog();
  }
  function renderReviews(reviews) {
    if (!reviews.length)
      return empty(
        "Cada experiência conta",
        "As avaliações aparecerão aqui depois dos primeiros serviços concluídos.",
      );
    return `<div class="review-list">${reviews.map((review) => `<article class="review-card"><div class="review-header"><strong>${esc(review.customer_name)}</strong><span class="star" aria-label="${review.rating} de 5 estrelas">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span></div><p>${esc(review.comment)}</p><small>${formatDate(review.created_at)}${review.is_example ? " · Avaliação de exemplo" : " · Serviço concluído"}</small></article>`).join("")}</div>`;
  }
  async function loadProfile(id, sequence) {
    $("#profile-content").innerHTML =
      '<p class="loading" role="status">Carregando perfil…</p>';
    const professional = getProfessionals().find((pro) => pro.id === id);
    if (!professional) throw new Error("Este profissional não foi encontrado.");
    const data = { professional, reviews: getReviews(id) };
    if (sequence !== state.routeSequence) return;
    const pro = data.professional;
    state.profile = pro;
    $("#profile-content").innerHTML =
      `<div class="profile-layout"><div class="profile-main"><article class="surface"><div class="profile-heading">${avatar(pro)}<div>${categoryLabel(pro.category)}<h1>${esc(pro.name)}</h1><p class="location">${icon("pin")}${esc(pro.neighborhood)} · ${esc(pro.city)}</p>${rating(pro)}</div></div><h2>Um pouco sobre meu trabalho</h2><p class="profile-bio">${esc(pro.bio)}</p></article><section class="surface" aria-labelledby="profile-reviews-title"><div class="section-heading"><h2 id="profile-reviews-title">O que os clientes dizem</h2><span class="badge">${pro.review_count} avaliações</span></div>${renderReviews(data.reviews)}</section></div><aside class="surface booking-card">${categoryLabel(pro.category)}<h2>${esc(pro.title)}</h2><div class="price"><span class="price-label">Valor inicial</span>${money(pro.price_cents)} <small>/ ${esc(pro.unit)}</small></div><p class="muted small">O orçamento final depende do serviço e será combinado com o profissional.</p><button class="button button-primary" id="open-request" type="button">Solicitar serviço →</button><p class="small">Demonstração local: o pedido fica neste navegador e não é enviado ao profissional.</p></aside></div>`;
  }

  //pedidos e avaliaçoes
  function openRequest() {
    const pro = state.profile;
    if (!pro) return;
    const form = $("#request-form");
    form.reset();
    $(".form-error", form).hidden = true;
    form.elements.professional_id.value = pro.id;
    $("#request-professional").textContent = `${pro.name} · ${pro.title}`;
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    $("#requested-date").min = today.toISOString().slice(0, 10);
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    $("#requested-date").max = nextYear.toISOString().slice(0, 10);
    openDialog("#request-dialog");
  }
  function requestCard(order, professional = false) {
    let actions = "";
    if (professional && order.status === "pending")
      actions = `<button class="button button-primary" data-order-status="accepted" data-id="${esc(order.id)}" type="button">Aceitar pedido</button><button class="button button-secondary" data-order-status="declined" data-id="${esc(order.id)}" type="button">Recusar</button>`;
    if (professional && order.status === "accepted")
      actions = `<button class="button button-primary" data-order-status="completed" data-id="${esc(order.id)}" type="button">Marcar como concluído</button>`;
    if (!professional && ["pending", "accepted"].includes(order.status))
      actions = `<button class="button button-danger" data-cancel-request="${esc(order.id)}" type="button">Cancelar pedido</button>`;
    if (!professional && order.status === "completed")
      actions = order.review_id
        ? '<span class="badge">Avaliação salva ✓</span>'
        : `<button class="button button-primary" data-review-request="${esc(order.id)}" type="button">Avaliar serviço ★</button>`;
    return `<article class="request-card"><div class="request-top"><div><span class="eyebrow">${professional ? "PEDIDO DE " + esc(order.customer_name) : esc(order.professional_name)}</span><h3>${esc(order.service_title)}</h3></div><span class="badge status-${order.status}">${statuses[order.status]}</span></div><div class="request-meta"><span>${formatDate(order.date)} · ${esc(order.period)}</span><span>A partir de ${money(order.price_cents)} / ${esc(order.unit)}</span></div><p class="request-notes">${esc(order.notes)}</p>${professional ? `<p class="contact">Contato: <a href="mailto:${esc(order.customer_email)}">${esc(order.customer_email)}</a></p>` : ""}<div class="button-row">${actions}</div></article>`;
  }
  async function loadRequests(sequence) {
    $("#customer-requests").innerHTML =
      '<p class="loading" role="status">Buscando seus pedidos…</p>';
    const data = { requests: getRequests() };
    if (sequence !== state.routeSequence) return;
    $("#customer-requests").innerHTML = data.requests.length
      ? data.requests.map((order) => requestCard(order)).join("")
      : empty(
          "Seu próximo cuidado começa aqui",
          "Você ainda não enviou uma solicitação neste navegador.",
          '<a class="button button-primary" href="#inicio">Encontrar profissionais</a>',
        );
  }
  $("#request-form").addEventListener("submit", (event) =>
    submitForm(event, async (body, form) => {
      saveRequest(body);
      form.reset();
      closeDialog($("#request-dialog"));
      toast("Solicitação salva neste navegador. Acompanhe em Meus pedidos.");
      location.hash = "#pedidos";
    }),
  );
  $("#review-form").addEventListener("submit", (event) =>
    submitForm(event, async (body, form) => {
      saveReview(body);
      form.reset();
      closeDialog($("#review-dialog"));
      toast("Avaliação salva neste navegador e exibida no perfil.");
      await route(false);
    }),
  );

  //painel profissional
  async function loadDashboard(sequence) {
    const professionals = getProfessionals();
    const professional =
      professionals.find((pro) => pro.id === state.selectedProfessional) ||
      professionals[0];
    state.selectedProfessional = professional.id;
    $("#dashboard-professional").innerHTML = professionals
      .map(
        (pro) =>
          `<option value="${esc(pro.id)}">${esc(pro.name)}${pro.is_example ? " (exemplo)" : ""}</option>`,
      )
      .join("");
    $("#dashboard-professional").value = professional.id;
    const data = {
      professional,
      requests: getRequests(professional.id),
      reviews: getReviews(professional.id),
    };
    if (sequence !== state.routeSequence) return;
    state.dashboard = data;
    const pro = data.professional;
    $("#dashboard-greeting").textContent =
      `Pedidos e avaliações de ${pro.name}, salvos neste navegador.`;
    $("#dashboard-stats").innerHTML = [
      [
        "Novas solicitações",
        data.requests.filter((order) => order.status === "pending").length,
      ],
      [
        "Serviços aceitos",
        data.requests.filter((order) => order.status === "accepted").length,
      ],
      [
        "Concluídos",
        data.requests.filter((order) => order.status === "completed").length,
      ],
      [
        "Avaliação média",
        pro.review_count
          ? `${Number(pro.rating).toFixed(1).replace(".", ",")} ★`
          : "—",
      ],
    ]
      .map(
        ([title, value]) =>
          `<div class="stat"><small>${title}</small><strong>${value}</strong></div>`,
      )
      .join("");
    $("#panel-requests").innerHTML = data.requests.length
      ? data.requests.map((order) => requestCard(order, true)).join("")
      : empty(
          "Nenhum pedido para este profissional",
          "Experimente solicitar um serviço no perfil. O pedido aparecerá neste painel local.",
          `<a class="button button-secondary" href="#perfil/${encodeURIComponent(pro.id)}">Ver meu perfil público</a>`,
        );
    $("#panel-reviews").innerHTML =
      `<div class="surface">${renderReviews(data.reviews)}</div>`;
    $("#edit-profile-fields").innerHTML = profileFields(pro);
    $("#public-profile-link").href = `#perfil/${encodeURIComponent(pro.id)}`;
  }
  function switchTab(name) {
    $$(".tab").forEach((tab) => {
      const active = tab.dataset.tab === name;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    $$("[role=tabpanel]").forEach((panel) => {
      panel.hidden = panel.id !== `panel-${name}`;
    });
  }
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const tabs = $$(".tab");
      const index = tabs.indexOf(tab);
      const next = {
        ArrowRight: (index + 1) % tabs.length,
        ArrowLeft: (index + tabs.length - 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next !== undefined) {
        event.preventDefault();
        switchTab(tabs[next].dataset.tab);
        tabs[next].focus();
      }
    });
  });
  $("#edit-profile-form").addEventListener("submit", (event) =>
    submitForm(event, async (body) => {
      const values = profileData(body);
      commitChange((data) => {
        const pro = data.professionals.find(
          (pro) => pro.id === state.selectedProfessional,
        );
        if (!pro) throw new Error("Escolha um profissional.");
        Object.assign(pro, values);
      });
      toast("Seu perfil foi atualizado.");
      await route(false);
    }),
  );

  //ADICIONAR SERVIÇO NO CATALOGO LOCAL
  function openOffer() {
    const form = $("#offer-form");
    form.reset();
    $(".form-error", form).hidden = true;
    openDialog("#offer-dialog");
  }
  $("#offer-button").addEventListener("click", openOffer);
  $("#offer-form").addEventListener("submit", (event) =>
    submitForm(event, async (body, form) => {
      const values = profileData(body);
      const id = newId();
      commitChange((data) =>
        data.professionals.unshift({
          ...values,
          id,
          is_example: false,
          created_at: Date.now(),
        }),
      );
      state.selectedProfessional = id;
      form.reset();
      closeDialog($("#offer-dialog"));
      toast("Serviço adicionado ao catálogo deste navegador.");
      if (location.hash === "#painel") await route();
      else location.hash = "#painel";
    }),
  );
  $("#dashboard-professional").addEventListener("change", (event) => {
    state.selectedProfessional = event.target.value;
    loadDashboard(state.routeSequence);
  });

  //delegação p evitar repetir listeners em cartões
  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    renderCatalog();
    $("#results-count").scrollIntoView({ block: "nearest" });
  });
  $("#search-query").addEventListener("input", renderCatalog);
  $("#search-city").addEventListener("change", renderCatalog);
  $("#search-sort").addEventListener("change", renderCatalog);
  function selectCategory(category) {
    state.category = category;
    $$(".category").forEach((button) => {
      const active = button.dataset.category === category;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderCatalog();
  }
  $("#category-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (button) selectCategory(button.dataset.category);
  });
  $("#clear-filters").addEventListener("click", () => {
    $("#search-form").reset();
    selectCategory("");
  });
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("close", () =>
      document.body.classList.remove("modal-open"),
    );
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          closeDialog(dialog);
      }
    });
  });
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.matches("[data-close-dialog]"))
      closeDialog(button.closest("dialog"));
    if (button.matches("[data-open-offer]")) openOffer();
    if (button.matches("#open-request")) openRequest();
    if (button.matches("[data-review-request]")) {
      const form = $("#review-form");
      form.reset();
      $(".form-error", form).hidden = true;
      form.elements.request_id.value = button.dataset.reviewRequest;
      openDialog("#review-dialog");
    }
    if (
      button.matches("[data-order-status],[data-cancel-request],[data-refresh]")
    ) {
      if (
        button.dataset.cancelRequest &&
        !window.confirm("Deseja cancelar este pedido?")
      )
        return;
      if (
        button.dataset.orderStatus === "completed" &&
        !window.confirm(
          "O serviço já foi realizado? Confirmar libera a avaliação do cliente.",
        )
      )
        return;
      if (
        button.dataset.orderStatus === "declined" &&
        !window.confirm("Deseja recusar esta solicitação?")
      )
        return;
      button.disabled = true;
      try {
        if (button.dataset.cancelRequest) {
          updateRequest(button.dataset.cancelRequest, "cancelled");
          toast("Pedido cancelado.");
        }
        if (button.dataset.orderStatus) {
          updateRequest(button.dataset.id, button.dataset.orderStatus);
          toast("Solicitação atualizada.");
        }
        await route(false);
      } catch (error) {
        toast(error.message);
      } finally {
        button.disabled = false;
      }
    }
  });
  async function route(focus = true) {
    const sequence = ++state.routeSequence;
    const [raw = "inicio", id] = location.hash.slice(1).split("/");
    const page = ["inicio", "perfil", "pedidos", "painel"].includes(raw)
      ? raw
      : "inicio";
    $$(".view").forEach((view) => {
      view.hidden = view.id !== `view-${page}`;
    });
    $$("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    setError("");
    try {
      if (page === "inicio") await loadCatalog();
      if (page === "perfil") await loadProfile(id || "", sequence);
      if (page === "pedidos") await loadRequests(sequence);
      if (page === "painel") await loadDashboard(sequence);
      if (focus && sequence === state.routeSequence) {
        $("#main").focus({ preventScroll: true });
        window.scrollTo({ top: 0 });
      }
    } catch (error) {
      if (sequence !== state.routeSequence) return;
      setError(error.message);
      if (page === "perfil") $("#profile-content").replaceChildren();
      if (page === "pedidos") $("#customer-requests").replaceChildren();
      if (page === "inicio")
        $("#results-count").textContent =
          "Não foi possível carregar os profissionais. Atualize a página para tentar novamente.";
    }
  }
  window.addEventListener("hashchange", () => route());

  // WEBMCP (filtros)
  function registerAgentTools() {
    if (!document.modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    window.addEventListener("pagehide", () => lifecycle.abort(), {
      once: true,
    });
    try {
      Promise.resolve(
        document.modelContext.registerTool(
          {
            name: "search_zelo_professionals",
            title: "Buscar profissionais no Zelo",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", maxLength: 100 },
                category: {
                  type: "string",
                  enum: ["", ...Object.keys(categories)],
                },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            async execute(input) {
              if (
                !input ||
                typeof input !== "object" ||
                Object.keys(input).some(
                  (key) => !["query", "category"].includes(key),
                ) ||
                (input.query !== undefined &&
                  (typeof input.query !== "string" ||
                    input.query.length > 100)) ||
                (input.category !== undefined &&
                  input.category !== "" &&
                  !Object.hasOwn(categories, input.category))
              )
                throw new Error("Filtros inválidos.");
              location.hash = "#inicio";
              await loadCatalog();
              $("#search-query").value = input.query || "";
              $("#search-city").value = "";
              selectCategory(input.category || "");
              return {
                professionals: renderCatalog().map((pro) => ({
                  id: pro.id,
                  name: pro.name,
                  category: pro.category,
                  city: pro.city,
                  example: Boolean(pro.is_example),
                })),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
    }
  }
  try {
    state.data = readLocalData();
    route(false);
    registerAgentTools();
  } catch (error) {
    setError(error.message);
    $("#results-count").textContent =
      "Atualize a página para abrir novamente o catálogo.";
  }

  // recarrega conteúdo
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && !memoryOnly) {
      state.data = readLocalData();
      route(false);
    }
  });
})();
