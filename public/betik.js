(() => {
  const eventsList = document.querySelector("#etkinlik-listesi");
  const statusMessage = document.querySelector("#etkinlik-durumu");
  const searchInput = document.querySelector("#etkinlik-ara");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const proposalForm = document.querySelector("#etkinlik-formu");
  const formMessage = document.querySelector("#form-mesaji");

  const typeNames = {
    atolye: "Atölye",
    soylesi: "Söyleşi",
    topluluk: "Topluluk",
  };
  let events = [];
  let selectedType = "all";

  function formatDate(date) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function createEventCard(event) {
    const card = document.createElement("article");
    card.className = "event-card";

    const type = document.createElement("span");
    type.className = "event-type";
    type.textContent = typeNames[event.tur] || "Etkinlik";

    const title = document.createElement("h3");
    title.textContent = event.baslik;

    const details = document.createElement("div");
    details.className = "event-details";

    const dateLine = document.createElement("p");
    const dateLabel = document.createElement("strong");
    dateLabel.textContent = "Tarih: ";
    const time = document.createElement("time");
    time.dateTime = event.tarih;
    time.textContent = formatDate(event.tarih);
    dateLine.append(dateLabel, time);

    const placeLine = document.createElement("p");
    const placeLabel = document.createElement("strong");
    placeLabel.textContent = "Yer: ";
    placeLine.append(placeLabel, document.createTextNode(event.yer));

    const capacityLine = document.createElement("p");
    const capacityLabel = document.createElement("strong");
    capacityLabel.textContent = "Kontenjan: ";
    capacityLine.append(
      capacityLabel,
      document.createTextNode(`${event.kontenjan} kişi`),
    );

    details.append(dateLine, placeLine, capacityLine);
    card.append(type, title, details);
    return card;
  }

  function renderEvents() {
    const query = searchInput.value.trim().toLocaleLowerCase("tr-TR");
    const visibleEvents = events.filter((event) => {
      const matchesType = selectedType === "all" || event.tur === selectedType;
      const matchesTitle = event.baslik
        .toLocaleLowerCase("tr-TR")
        .includes(query);
      return matchesType && matchesTitle;
    });

    eventsList.replaceChildren(...visibleEvents.map(createEventCard));
    eventsList.setAttribute("aria-busy", "false");
    statusMessage.textContent = visibleEvents.length
      ? `${visibleEvents.length} etkinlik listeleniyor.`
      : "Aramanıza uygun etkinlik yok.";
  }

  function selectType(button) {
    selectedType = button.dataset.filter;
    for (const filterButton of filterButtons) {
      filterButton.setAttribute(
        "aria-pressed",
        String(filterButton === button),
      );
    }
    renderEvents();
  }

  async function loadEvents() {
    eventsList.setAttribute("aria-busy", "true");
    statusMessage.textContent = "Etkinlikler yükleniyor...";

    try {
      const response = await fetch("/api/etkinlikler");
      if (!response.ok) {
        throw new Error(`Etkinlikler alınamadı (HTTP ${response.status}).`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new TypeError("Sunucudan beklenen etkinlik listesi alınamadı.");
      }

      events = data;
      renderEvents();
    } catch (error) {
      console.error("Etkinlikler yüklenemedi:", error);
      eventsList.replaceChildren();
      eventsList.setAttribute("aria-busy", "false");
      statusMessage.textContent =
        "Etkinlikler yüklenemedi. Sunucu bağlantınızı kontrol edip yeniden deneyin.";
    }
  }

  function setFieldError(fieldName, message) {
    const field = proposalForm.elements.namedItem(fieldName);
    const errorMessage = document.querySelector(`#${fieldName}-hatasi`);
    errorMessage.textContent = message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
    return Boolean(message);
  }

  function validateProposal(formData) {
    const title = String(formData.get("baslik")).trim();
    const type = String(formData.get("tur"));
    const date = String(formData.get("tarih"));
    const place = String(formData.get("yer")).trim();
    const capacity = Number(formData.get("kontenjan"));
    const email = proposalForm.elements.namedItem("eposta");
    const today = new Date();
    const localToday = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const errors = {
      baslik:
        title.length < 5
          ? "Etkinlik adı en az 5 karakter olmalıdır."
          : "",
      tur: typeNames[type] ? "" : "Lütfen etkinlik türünü seçin.",
      tarih:
        !date || date < localToday
          ? "Bugün veya daha ileri bir tarih seçin."
          : "",
      yer: place ? "" : "Etkinlik yerini yazın.",
      kontenjan:
        Number.isInteger(capacity) && capacity >= 1 && capacity <= 5000
          ? ""
          : "Kontenjan 1 ile 5000 arasında bir tam sayı olmalıdır.",
      eposta:
        !email.value.trim() || email.validity.typeMismatch
          ? "Geçerli bir e-posta adresi yazın."
          : "",
    };

    let firstInvalidField;
    for (const [fieldName, message] of Object.entries(errors)) {
      if (setFieldError(fieldName, message) && !firstInvalidField) {
        firstInvalidField = proposalForm.elements.namedItem(fieldName);
      }
    }
    return { errors, firstInvalidField, values: { title, type, date, place, capacity } };
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => selectType(button));
  }
  searchInput.addEventListener("input", renderEvents);

  proposalForm.addEventListener("input", (event) => {
    if (event.target.name) {
      setFieldError(event.target.name, "");
    }
    formMessage.textContent = "";
    formMessage.removeAttribute("data-state");
  });

  proposalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = validateProposal(new FormData(proposalForm));
    if (result.firstInvalidField) {
      formMessage.dataset.state = "error";
      formMessage.textContent = "Lütfen işaretli alanları kontrol edin.";
      result.firstInvalidField.focus();
      return;
    }

    const nextId = events.reduce(
      (largestId, item) => Math.max(largestId, Number(item.id) || 0),
      0,
    );
    events.push({
      id: nextId + 1,
      baslik: result.values.title,
      tur: result.values.type,
      tarih: result.values.date,
      yer: result.values.place,
      kontenjan: result.values.capacity,
    });

    selectedType = "all";
    searchInput.value = "";
    for (const button of filterButtons) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === "all"),
      );
    }
    renderEvents();
    proposalForm.reset();
    formMessage.dataset.state = "success";
    formMessage.textContent =
      "Etkinlik öneriniz bu oturumun listesine eklendi.";
  });

  loadEvents();
})();