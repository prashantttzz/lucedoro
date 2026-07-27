function productDetail(productJson) {
  return {
    product: productJson,
    selectedVariant: productJson.variants[0],
    currentImage: '',
    isAdding: false,
    accordionOpen: false,

    init() {
      const params = new URLSearchParams(window.location.search);
      const variantId = params.get('variant');
      if (variantId) {
        const variant = this.product.variants.find((v) => v.id == variantId);
        if (variant) {
          this.selectedVariant = variant;
          if (variant.featured_image) {
            this.currentImage = variant.featured_image.src;
          }
        }
      }
    },

    get price() {
      return this.formatMoney(this.selectedVariant.price);
    },

    get compareAtPrice() {
      if (this.selectedVariant.compare_at_price > this.selectedVariant.price) {
        return this.formatMoney(this.selectedVariant.compare_at_price);
      }
      return null;
    },

    get isAvailable() {
      return this.selectedVariant.available;
    },

    selectVariant(variantId) {
      const variant = this.product.variants.find((v) => v.id === variantId);
      if (variant) {
        this.selectedVariant = variant;
        
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id.toString());
        window.history.replaceState({}, '', url.toString());

        if (variant.featured_image) {
          this.currentImage = variant.featured_image.src;
        }
      }
    },

    selectOption(optionIndex, value) {
      const currentOptions = [...this.selectedVariant.options];
      currentOptions[optionIndex] = value;
      
      const newVariant = this.product.variants.find((v) => {
        return v.options.every((opt, i) => opt === currentOptions[i]);
      });

      if (newVariant) {
        this.selectVariant(newVariant.id);
      }
    },

    setCurrentImage(imgSrc) {
      this.currentImage = imgSrc;
    },

    async addToCart() {
      if (!this.selectedVariant.available) return;
      
      this.isAdding = true;

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                id: this.selectedVariant.id,
                quantity: 1
              }
            ]
          })
        });

        if (response.ok) {
          document.documentElement.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
          console.log('Added to cart');
        } else {
          console.error('Failed to add to cart');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setTimeout(() => {
          this.isAdding = false;
        }, 500);
      }
    },

    formatMoney(cents) {
      return (cents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      });
    }
  };
}

document.addEventListener('alpine:init', () => {
  if (window.Alpine) {
    window.Alpine.data('productDetail', productDetail);
  }
});

if (typeof window !== 'undefined') {
  window.productDetail = productDetail;
}