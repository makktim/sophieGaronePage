"use client";
import styles from "./modal.module.css";
import { RootState } from "../../store/store";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "@/app/store/slices/contentSlice";

export default function Modal() {
  const dispatch = useDispatch();
  const { subscribe } = useSelector(
    (state: RootState) => state.content.content
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    type: "Feliratkozás előrendelésre",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCloseClick = () => {
    dispatch(closeModal());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    console.log("formData", formData);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessage("Sikeresen feliratkoztál");
        setFormData({ name: "", email: "", message: "", type: "" });
      } else {
        throw new Error(
          "Hiba történt a feliratkozás során, kérjük hogy vedd fel velünk a kapcsolatot e-mailben."
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "Ismeretlen hiba történt, kérjük vedd fel velünk a kapcsolatot emailben!"
        );
      }
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.modalHeader}>
          <a className={styles.closeButton} href="#" onClick={handleCloseClick}>
            x
          </a>
        </div>
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <h6 className={styles.title}>{subscribe.title}</h6>
        <h6 className={styles.description}>{subscribe.description}</h6>
        <input
          className={styles.input}
          name="name"
          id="name"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          className={styles.input}
          name="email"
          id="email"
          placeholder="email@example.com"
          onChange={handleChange}
        />
        <button className={styles.button} type="submit">
          {subscribe.btn}
        </button>
      </form>
    </div>
  );
}
