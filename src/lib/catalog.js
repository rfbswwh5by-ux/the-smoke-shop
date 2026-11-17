import { useEffect, useState } from "react";
import { getCatalog, getFaqs } from "@/lib/server-fns";
import { categoryImage } from "@/lib/defaultMedia";

export const AVAILABILITY_OPTIONS = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "special_order", label: "Special order" },
];

export const AVAILABILITY_LABELS = AVAILABILITY_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function withFallbackImage(product) {
  return { ...product, image_url: product.image_url || categoryImage(product.category) };
}

export function useCatalog() {
  const [state, setState] = useState({ products: [], categories: [], loading: true });

  useEffect(() => {
    let alive = true;
    getCatalog()
      .then((catalog) => {
        if (!alive) return;
        const products = (catalog?.products || []).map(withFallbackImage);
        const categories = (catalog?.categories || []).map((category) => ({
          ...category,
          image_url: category.image_url || categoryImage(category.name),
          count: products.filter((product) => product.category === category.name).length,
        }));
        setState({ products, categories, loading: false });
      })
      .catch(() => {
        if (alive) setState({ products: [], categories: [], loading: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export function useFaqs() {
  const [faqs, setFaqs] = useState([]);
  useEffect(() => {
    let alive = true;
    getFaqs()
      .then((list) => alive && setFaqs(Array.isArray(list) ? list : []))
      .catch(() => alive && setFaqs([]));
    return () => {
      alive = false;
    };
  }, []);
  return faqs;
}