'use strict';

// This function handles the rules independently of the page, making them easy to test.
function calculateOrder(food, quantityInput, delivery) {
  let foodPrice;
  let foodName;
  const errors = {};

  // Each meal has one fixed price. Unknown and empty selections are rejected.
  switch (food) {
    case 'chicken': foodPrice = 5000; foodName = 'Grilled Chicken'; break;
    case 'rice': foodPrice = 3500; foodName = 'House Rice Bowl'; break;
    case 'burger': foodPrice = 4500; foodName = 'Classic Beef Burger'; break;
    case 'pasta': foodPrice = 4000; foodName = 'Basil Pesto Pasta'; break;
    default: errors.food = 'Please choose a meal from the menu.';
  }

  const quantityText = String(quantityInput ?? '').trim();
  const quantity = Number(quantityText);
  if (quantityText === '' || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    errors.quantity = 'Enter a whole number from 1 to 10.';
  }

  let deliveryFee;
  switch (delivery) {
    case 'pickup': deliveryFee = 0; break;
    case 'nearby': deliveryFee = 500; break;
    case 'far': deliveryFee = 1500; break;
    default: errors.delivery = 'Please choose pickup, nearby delivery or far delivery.';
  }

  // Return before calculating anything if one or more entries are invalid.
  if (Object.keys(errors).length > 0) return { valid: false, errors };

  const subtotal = foodPrice * quantity;
  const total = subtotal + deliveryFee; // Add delivery ONCE, not once per portion.
  return { valid: true, foodName, quantity, subtotal, deliveryFee, total };
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('order-form');
  const result = document.getElementById('order-result');
  const fieldNames = ['food', 'quantity', 'delivery'];
  const currency = value => 'NGN ' + value.toLocaleString('en-NG');

  function clearErrors() {
    fieldNames.forEach(name => {
      document.getElementById(name).removeAttribute('aria-invalid');
      document.getElementById(name + '-error').textContent = '';
    });
  }

  // Clear the old summary whenever an entry changes so stale totals never remain.
  function resetResult() {
    clearErrors();
    result.innerHTML = '<p class="result-placeholder">Calculate to see your updated order summary.</p>';
  }

  form.addEventListener('input', resetResult);
  form.addEventListener('change', resetResult);
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearErrors();
    const order = calculateOrder(form.elements.food.value, form.elements.quantity.value, form.elements.delivery.value);

    if (!order.valid) {
      Object.entries(order.errors).forEach(([name, message]) => {
        document.getElementById(name).setAttribute('aria-invalid', 'true');
        document.getElementById(name + '-error').textContent = message;
      });
      result.innerHTML = '<p class="result-error">Please fix the highlighted entries, then calculate again.</p>';
      document.getElementById(Object.keys(order.errors)[0]).focus();
      return;
    }

    // Only trusted food names and validated numeric values are rendered here.
    result.innerHTML = `
      <p class="summary-heading">Your happy plate, summed up</p>
      <dl class="summary-list">
        <div><dt>Food</dt><dd>${order.foodName}</dd></div>
        <div><dt>Quantity</dt><dd>${order.quantity}</dd></div>
        <div><dt>Subtotal</dt><dd>${currency(order.subtotal)}</dd></div>
        <div><dt>Delivery fee</dt><dd>${currency(order.deliveryFee)}</dd></div>
        <div class="grand-total"><dt>Final total</dt><dd>${currency(order.total)}</dd></div>
      </dl>`;
  });

  // Menu links preselect the corresponding meal and take the visitor to the form.
  document.querySelectorAll('[data-food]').forEach(link => {
    link.addEventListener('click', () => {
      form.elements.food.value = link.dataset.food;
      resetResult();
    });
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  // Reveal sections once as they enter the viewport. Content stays visible in
  // browsers without IntersectionObserver, and reduced-motion preferences win.
  if ('IntersectionObserver' in window) {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });

      document.querySelectorAll('.section-top, .food-card, .about-inner, .order-intro, .order-panel').forEach(element => {
        element.classList.add('scroll-reveal');
        revealObserver.observe(element);
      });
    }

    const navigationLinks = document.querySelectorAll('.navbar a[href^="#"]');
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navigationLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + entry.target.id) {
              link.setAttribute('aria-current', 'location');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }
}

// Allow the same calculation rules to be checked with Node.js.
if (typeof module !== 'undefined') module.exports = { calculateOrder };
