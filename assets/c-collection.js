(function() {
  if (window.__ldcCustomizerDrawerInitialized) return;
  window.__ldcCustomizerDrawerInitialized = true;

  let currentProduct = null;
  let selectedVariant = null;
  let selectedLens = { id: 'g15', name: 'G15', color: '#2a4b3c', price: 19 };

  const mockLenses = [
    { id: 'g15', name: 'G15', color: '#2a4b3c', price: 19 },
    { id: 'yellow', name: 'Yellow', color: '#f4d03f', price: 19 },
    { id: 'blue', name: 'Light Blue', color: '#85c1e9', price: 19 },
    { id: 'brown', name: 'Brown', color: '#8b4513', price: 19 },
    { id: 'orange', name: 'Orange', color: '#e67e22', price: 19 },
    { id: 'green', name: 'Light Green', color: '#abebc6', price: 19 },
    { id: 'purple', name: 'Purple', color: '#8e44ad', price: 19 }
  ];

  function getDrawer() {
    return document.getElementById('c-customizer-drawer');
  }

  function canUseDialogDrawer(drawer) {
    return !!drawer && typeof drawer.showDialog === 'function' && typeof drawer.closeDialog === 'function';
  }

  function getMoneyText(priceInCents) {
    return (priceInCents / 100).toFixed(2) + ' EUR';
  }

  function getImageSrc(imageValue, fallbackSrc) {
    if (imageValue && typeof imageValue.src === 'string' && imageValue.src.length > 0) {
      return imageValue.src;
    }

    if (typeof imageValue === 'string' && imageValue.length > 0) {
      return imageValue;
    }

    return fallbackSrc || '';
  }

  function renderStep1() {
    if (!currentProduct) return;

    const titleEl = document.getElementById('c-drawer-product-title');
    const priceEl = document.getElementById('c-drawer-product-price');
    const previewImgEl = document.getElementById('c-drawer-preview-img');
    const lensNameEl = document.getElementById('c-drawer-selected-lens-name');
    const swatchesEl = document.getElementById('c-drawer-swatches-container');

    if (!titleEl || !priceEl || !previewImgEl || !lensNameEl || !swatchesEl) return;

    titleEl.textContent = (currentProduct.title || '').toLowerCase();
    priceEl.textContent = getMoneyText(selectedVariant ? selectedVariant.price : currentProduct.price);

    const mainImg = getImageSrc(
      selectedVariant && selectedVariant.featured_image,
      getImageSrc(currentProduct.featured_image, '')
    );

    previewImgEl.src = mainImg;
    lensNameEl.textContent = selectedLens ? selectedLens.name : 'Standard';
    swatchesEl.innerHTML = '';

    if (!currentProduct.variants || currentProduct.variants.length === 0) return;

    currentProduct.variants.forEach((variant) => {
      const swatch = document.createElement('div');
      swatch.className = 'c-drawer-frame-swatch' + (selectedVariant && variant.id === selectedVariant.id ? ' is-active' : '');

      const variantImgSrc = getImageSrc(variant.featured_image, mainImg);
      swatch.innerHTML = `
        <img src="${variantImgSrc}" alt="${variant.title}">
        <span class="c-drawer-swatch-title">${variant.title}</span>
      `;

      swatch.addEventListener('click', function() {
        selectedVariant = variant;
        renderStep1();
        renderStep2();
      });

      swatchesEl.appendChild(swatch);
    });
  }

  function renderStep2() {
    if (!currentProduct) return;

    const miniImgEl = document.getElementById('c-drawer-mini-img');
    const miniTitleEl = document.getElementById('c-drawer-mini-title');
    const listEl = document.getElementById('c-drawer-lens-list-container');

    if (!miniImgEl || !miniTitleEl || !listEl) return;

    const mainImg = getImageSrc(
      selectedVariant && selectedVariant.featured_image,
      getImageSrc(currentProduct.featured_image, '')
    );

    miniImgEl.src = mainImg;
    miniTitleEl.textContent = (currentProduct.title || '').toLowerCase();
    listEl.innerHTML = '';

    mockLenses.forEach((lens) => {
      const item = document.createElement('div');
      item.className = 'c-drawer-lens-item' + (selectedLens && selectedLens.id === lens.id ? ' is-selected' : '');
      item.innerHTML = `
        <div class="c-drawer-lens-left">
          <span class="c-drawer-lens-dot" style="background-color: ${lens.color};"></span>
          <span class="c-drawer-lens-title">${lens.name}</span>
        </div>
        <div class="c-drawer-lens-right">
          <span class="c-drawer-lens-price">+${lens.price} EUR</span>
          <button type="button" class="c-drawer-lens-add-btn">
            <span>${selectedLens && selectedLens.id === lens.id ? '&#10003;' : '+'}</span>
          </button>
        </div>
      `;

      item.addEventListener('click', function() {
        selectedLens = lens;
        renderStep1();
        renderStep2();
      });

      listEl.appendChild(item);
    });
  }

  window.goToStep = function(stepNum) {
    const step1 = document.getElementById('c-drawer-step-1');
    const step2 = document.getElementById('c-drawer-step-2');
    if (!step1 || !step2) return;

    if (stepNum === 1) {
      step1.style.display = 'flex';
      step2.style.display = 'none';
    } else {
      step1.style.display = 'none';
      step2.style.display = 'flex';
    }
  };

  window.openCustomizerDrawer = function(cardEl) {
    const drawer = getDrawer();
    if (!cardEl || !canUseDialogDrawer(drawer)) return;

    const jsonScript = cardEl.querySelector('.product-json-data');
    if (!jsonScript) return;

    try {
      currentProduct = JSON.parse(jsonScript.textContent);
      selectedVariant = currentProduct.variants && currentProduct.variants.length > 0 ? currentProduct.variants[0] : null;
      selectedLens = mockLenses[0];

      renderStep1();
      renderStep2();
      window.goToStep(1);
      drawer.showDialog();
    } catch (error) {
      console.error('Error opening customizer drawer:', error);
    }
  };

  window.closeCustomizerDrawer = function() {
    const drawer = getDrawer();
    if (!canUseDialogDrawer(drawer)) return;
    drawer.closeDialog();
  };

  function postToCart(properties) {
    if (!selectedVariant) return;

    const btn = document.getElementById('c-drawer-add-lenses-btn');
    if (btn) btn.textContent = 'ADDING...';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            id: selectedVariant.id,
            quantity: 1,
            properties: properties
          }
        ]
      })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        document.documentElement.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        window.closeCustomizerDrawer();
        alert('Added to cart!');
      })
      .catch((error) => {
        console.error(error);
        alert('Failed to add to cart');
      })
      .finally(() => {
        if (btn) btn.textContent = 'ADD TO CART WITH LENSES';
      });
  }

  window.buyFrameOnly = function() {
    postToCart({});
  };

  window.addToCartWithLenses = function() {
    postToCart({
      'Lens Color': selectedLens ? selectedLens.name : 'Standard',
      'Lens Type': 'Customized Sunglasses'
    });
  };

  document.addEventListener('click', function(event) {
    const trigger = event.target.closest('[data-customizer-trigger]');
    if (!trigger) return;

    event.preventDefault();
    window.openCustomizerDrawer(trigger);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      window.closeCustomizerDrawer();
    }
  });
})();
