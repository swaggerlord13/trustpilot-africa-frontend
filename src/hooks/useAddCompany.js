import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import { useToast } from "../components/Toast.jsx";

/**
 * Shared hook for the "Add a Company" modal flow.
 * Used by Homepage, CategoryCompanies, and Subcategory.
 *
 * @param {Object} options
 * @param {Function} [options.onSuccess] - Optional callback after company is created (receives saved company data)
 */
export default function useAddCompany({ onSuccess } = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddCompany = async ({ name, url, city, country }) => {
    const newCompany = { name, url: url || "", city: city || "", country: country || "" };
    try {
      const { data: savedCompany } = await api.post("/companies", newCompany);
      closeModal();
      if (onSuccess) onSuccess(savedCompany);
      navigate(`/company/${savedCompany.slug}?openReview=true`);
    } catch (err) {
      console.error("Error creating company:", err);
      showToast(err.response?.data?.message || err.response?.data?.error || `Error adding company: ${err.message}`, "error");
      throw err;
    }
  };

  return { isModalOpen, openModal, closeModal, handleAddCompany };
}
