import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000/api";

const PaymentStatus = () => {
  const [status, setStatus] = useState("checking");
  const [order, setOrder] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) return;

   const checkPaymentStatus = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/orders/${orderId}`,{ withCredentials: true });
    setOrder(data.order);

    if (data.order.paymentStatus === "paid") {
      setStatus("success");
      clearInterval(interval); // stop polling
    } else if (data.order.paymentStatus === "pending") {
      setStatus("pending");
    } else {
      setStatus("failed");
      clearInterval(interval); 
    }
  } catch (err) {
    console.error(err);
    setStatus("failed");
    clearInterval(interval);
  }};

    // 🔁 Polling (because webhook may take time)
    checkPaymentStatus();
    const interval = setInterval(checkPaymentStatus, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center w-full max-w-md">

        {status === "checking" && (
          <h2 className="text-lg font-semibold">Checking payment...</h2>
        )}

        {status === "pending" && (
          <>
            <h2 className="text-yellow-600 text-xl font-semibold">
              Payment Pending
            </h2>
            <p className="text-gray-500 mt-2">
              Waiting for confirmation...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-green-600 text-xl font-semibold">
              Payment Successful 🎉
            </h2>
            <p className="text-gray-500 mt-2">
              Your order has been placed.
            </p>

            <button
              onClick={() => navigate("/orders")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Go to Orders
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <h2 className="text-red-600 text-xl font-semibold">
              Payment Failed ❌
            </h2>
            <p className="text-gray-500 mt-2">
              Please try again.
            </p>

            <button
              onClick={() => navigate("/cart")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentStatus;