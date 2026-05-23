export const loadCashfree = () => {
  return new Promise((resolve) => {
    if (window.Cashfree) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiateCashfreePayment = async (paymentSessionId) => {
  const loaded = await loadCashfree();

  if (!loaded) {
    alert("Cashfree SDK failed to load");
    return;
  }

  const cashfree = window.Cashfree({
    mode: "sandbox", // ✅ test mode
  });

  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self", // redirect same tab
  });
};