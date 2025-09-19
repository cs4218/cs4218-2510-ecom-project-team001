import { useState, useEffect } from "react";
import axios from "axios";

export default function useCategory() {
  const [categories, setCategories] = useState([]);

  //get cat
  const getCategories = async () => {
    try {
      const res = await axios.get("/api/v1/category/get-category");
      const data = res?.data;
      if (!data?.success) {
        throw new Error("Failed to fetch categories");
      }
      setCategories(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return categories;
}