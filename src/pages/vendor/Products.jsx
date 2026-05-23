import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  PackagePlus,
  Pencil,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Accessories",
  "Home",
  "Fitness",
  "Furniture",
  "Beauty",
  "Groceries",
  "Books",
  "Toys",
];

const sampleProducts = [
  {
    _id: "699f4d28076d0922b09976a7",
    name: "Quantum Sound Headphones",
    category: "Electronics",
    price: 199.99,
    stock: 18,
    isActive: true,
    description: "Wireless over-ear headphones with adaptive noise cancellation.",
    images: ["https://via.placeholder.com/400x300?text=Headphones"],
    createdAt: "2026-03-26T19:44:05.811Z",
  },
  {
    _id: "69a09fc6a66fd024f4c6461e",
    name: "Elite Shoes",
    category: "Fashion",
    price: 2695,
    stock: 3,
    isActive: true,
    description: "Lightweight streetwear sneakers with cushioned soles.",
    images: ["https://via.placeholder.com/400x300?text=Shoes"],
    createdAt: "2026-03-18T10:21:04.000Z",
  },
  {
    _id: "69b29fc6a66fd024f4c6444e",
    name: "Urban Backpack",
    category: "Accessories",
    price: 1499,
    stock: 0,
    isActive: false,
    description: "Compact commuter backpack with laptop sleeve and bottle pocket.",
    images: ["https://via.placeholder.com/400x300?text=Backpack"],
    createdAt: "2026-02-09T08:10:00.000Z",
  },
];

const emptyFormState = {
  name: "",
  category: "",
  price: "",
  stock: "",
  imagePreview: "",
  imagePreviews: [],
  imageItems: [],
  imageFiles: [],
  removedImages: [],
  thumbnailKey: "",
  imageName: "",
  description: "",
  isActive: true,
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInventoryState = (product) => {
  if ((product.stock || 0) <= 0) return "out";
  if ((product.stock || 0) <= 5) return "low";
  return "in";
};

const getStatusBadgeClasses = (state) => {
  switch (state) {
    case "active":
    case "in":
      return "bg-green-50 text-green-700 border-green-100";
    case "low":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "inactive":
    case "out":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const normalizeProduct = (product = {}) => ({
  ...product,
  name: product.name || "",
  category: product.category || "",
  price: Number(product.price || 0),
  stock: Number(product.stock || 0),
  isActive: product.isActive !== false,
  description: product.description || "",
  images: Array.isArray(product.images) ? product.images : [],
  createdAt: product.createdAt || new Date().toISOString(),
});

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.url || image.secure_url || image.path || "";
};

const normalizeImageItem = (image) => {
  const url = getImageUrl(image);
  if (!url) return null;

  if (typeof image === "string") {
    return { url };
  }

  return {
    ...image,
    url,
    public_id: image.public_id || image.publicId || image.filename || "",
  };
};

const getProductImageItems = (product) =>
  (Array.isArray(product?.images) ? product.images : []).map(normalizeImageItem).filter(Boolean);

const getProductImages = (product) =>
  getProductImageItems(product).map((image) => image.url);

const getProductImage = (product) =>
  getProductImages(product)[0] || "https://via.placeholder.com/400x300?text=No+Image";

const getImageKey = (image, index = 0) =>
  image?.public_id || image?.url || `image-${index}`;

const moveImageToFront = (images, thumbnailKey) => {
  if (!thumbnailKey) return images;

  const thumbnailIndex = images.findIndex((image, index) => getImageKey(image, index) === thumbnailKey);
  if (thumbnailIndex <= 0) return images;

  const nextImages = [...images];
  const [thumbnail] = nextImages.splice(thumbnailIndex, 1);
  return [thumbnail, ...nextImages];
};

const getPaginationNumber = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");
  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
};

const getApiSortParams = (value) => {
  switch (value) {
    case "name":
      return { sort: "name", order: "asc" };
    case "price-low":
      return { sort: "price", order: "asc" };
    case "price-high":
      return { sort: "price", order: "desc" };
    case "stock-low":
      return { sort: "stock", order: "asc" };
    case "latest":
    default:
      return { sort: "createdAt", order: "desc" };
  }
};

const toFormState = (product) => {
  const imageItems = getProductImageItems(product);
  const imagePreviews = imageItems.map((image) => image.url);
  const thumbnailKey = imageItems[0] ? getImageKey(imageItems[0], 0) : "";

  return {
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price ?? "",
    stock: product?.stock ?? "",
    imagePreview: imagePreviews[0] || "",
    imagePreviews,
    imageItems,
    imageFiles: [],
    removedImages: [],
    thumbnailKey,
    imageName: "",
    description: product?.description || "",
    isActive: product?.isActive !== false,
  };
};

const createLocalProductPayload = (formState, existingProduct) => {
  const imageItems = moveImageToFront(formState.imageItems || [], formState.thumbnailKey);

  return {
    ...existingProduct,
    _id:
      existingProduct?._id ||
      `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: formState.name.trim(),
    category: formState.category.trim(),
    price: Number(formState.price || 0),
    stock: Number(formState.stock || 0),
    isActive: Boolean(formState.isActive),
    description: formState.description.trim(),
    images: imageItems.map((image) =>
      image.public_id ? { url: image.url, public_id: image.public_id } : image.url
    ),
    createdAt: existingProduct?.createdAt || new Date().toISOString(),
  };
};

const createProductFormData = (formState) => {
  const formData = new FormData();
  const orderedImageItems = moveImageToFront(formState.imageItems || [], formState.thumbnailKey);
  const existingImages = orderedImageItems
    .map((image) => image.url)
    .filter((image) => !image.startsWith("blob:"));
  const imageOrder = orderedImageItems
    .filter((image) => !image.file)
    .map((image) => ({
      public_id: image.public_id,
      url: image.url,
    }));

  formData.append("name", formState.name.trim());
  formData.append("category", formState.category.trim());
  formData.append("price", String(Number(formState.price || 0)));
  formData.append("stock", String(Number(formState.stock || 0)));
  formData.append("description", formState.description.trim());
  formData.append("isActive", String(Boolean(formState.isActive)));

  if (imageOrder.length) {
    formData.append("imageOrder", JSON.stringify(imageOrder));
  }

  if (existingImages.length) {
    formData.append("existingImages", JSON.stringify(existingImages));
    existingImages.forEach((image) => formData.append("existingImage", image));
  }

  if (formState.removedImages?.length) {
    formData.append("removeImages", JSON.stringify(formState.removedImages));
  }

  if (formState.thumbnailKey) {
    const thumbnailImage = orderedImageItems.find(
      (image, index) => getImageKey(image, index) === formState.thumbnailKey
    );

    if (thumbnailImage?.public_id) {
      formData.append("thumbnailPublicId", thumbnailImage.public_id);
    }

    if (thumbnailImage?.url) {
      formData.append("thumbnailUrl", thumbnailImage.url);
    }
  }

  if (formState.imageFiles?.length) {
    formState.imageFiles.forEach((file) => formData.append("images", file));
  }

  return formData;
};

const createProductFormDataFromProduct = (product, thumbnailKey) => {
  const imageItems = moveImageToFront(getProductImageItems(product), thumbnailKey);
  const thumbnailImage = imageItems[0];
  const formData = new FormData();

  formData.append("name", product.name || "");
  formData.append("category", product.category || "");
  formData.append("price", String(Number(product.price || 0)));
  formData.append("stock", String(Number(product.stock || 0)));
  formData.append("description", product.description || "");
  formData.append("isActive", String(product.isActive !== false));
  formData.append(
    "imageOrder",
    JSON.stringify(
      imageItems.map((image) => ({
        public_id: image.public_id,
        url: image.url,
      }))
    )
  );

  if (thumbnailImage?.public_id) {
    formData.append("thumbnailPublicId", thumbnailImage.public_id);
  }

  if (thumbnailImage?.url) {
    formData.append("thumbnailUrl", thumbnailImage.url);
  }

  return formData;
};

const SummaryCard = ({ title, value, helper }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{helper}</p>
  </div>
);

const ProductsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="h-28 rounded-2xl border border-gray-100 bg-white animate-pulse"
        />
      ))}
    </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="h-12 rounded-2xl bg-gray-100 animate-pulse mb-5" />
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
          />
        ))}
      </div>
    </div>
  </div>
);

const ModalShell = ({ open, title, subtitle, onClose, children, width = "max-w-3xl" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 sm:p-6">
      <div className={`mt-4 w-full ${width} overflow-hidden rounded-[28px] bg-white shadow-2xl`}>
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">{title}</p>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const ProductFormModal = ({
  open,
  mode,
  formState,
  onChange,
  onSubmit,
  onClose,
  saving,
}) => {
  const isEdit = mode === "edit";
  const thumbnailImage =
    formState.imageItems?.find(
      (image, index) => getImageKey(image, index) === formState.thumbnailKey
    ) || formState.imageItems?.[0];
  const previewImage =
    thumbnailImage?.url ||
    formState.imagePreviews?.[0] ||
    formState.imagePreview ||
    "https://via.placeholder.com/400x300?text=Preview";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add Product"}
      subtitle={
        isEdit
          ? "Update details with the same clean layout used across the vendor dashboard."
          : "Create a product with the same polished surface as the rest of your vendor tools."
      }
    >
      <form onSubmit={onSubmit} className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Product Name</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => onChange("name", event.target.value)}
                  placeholder="Premium Cotton Tee"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Category</span>
                <select
                  value={formState.category}
                  onChange={(event) => onChange("category", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  {PRODUCT_CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) => onChange("price", event.target.value)}
                  placeholder="1499"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formState.stock}
                  onChange={(event) => onChange("stock", event.target.value)}
                  placeholder="24"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Product Images</span>
              <div className="mt-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => onChange("imageFiles", Array.from(event.target.files || []))}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                />
                <p className="mt-3 text-sm text-gray-500">
                  {formState.imageName
                    ? `Selected: ${formState.imageName}`
                    : formState.imagePreviews?.length
                      ? `Using ${formState.imagePreviews.length} current product image${
                          formState.imagePreviews.length === 1 ? "" : "s"
                        }.`
                      : "Choose one or more images from your device for the product preview."}
                </p>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                rows={5}
                value={formState.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Add a short description that helps you recognize the product quickly."
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm">
              <img
                src={previewImage}
                alt={formState.name || "Product preview"}
                className="h-52 w-full bg-gray-50 object-cover"
              />
              {formState.imagePreviews?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 border-b border-gray-100 p-3">
                  {formState.imageItems.slice(0, 8).map((image, index) => {
                    const imageKey = getImageKey(image, index);
                    const isThumbnail = imageKey === formState.thumbnailKey;

                    return (
                      <div
                        key={`${image.url}-${index}`}
                        className={`relative rounded-xl ${
                          isThumbnail ? "ring-2 ring-blue-500 ring-offset-2" : ""
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`Product preview ${index + 1}`}
                          className="h-14 w-full rounded-xl border border-gray-100 bg-gray-50 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onChange("thumbnailImage", imageKey)}
                          className={`absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition ${
                            isThumbnail
                              ? "bg-blue-600 text-white"
                              : "bg-white/95 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                          aria-label={`Use image ${index + 1} as thumbnail`}
                          title="Use as thumbnail"
                        >
                          {isThumbnail ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onChange("removeImage", index)}
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition hover:bg-red-50"
                          aria-label={`Remove image ${index + 1}`}
                          title="Remove image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Live Preview
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {formState.name || "Untitled product"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formState.category || "Choose a category"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Price</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(formState.price)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Stock</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {Number(formState.stock || 0)}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-blue-50/60 p-4">
                  <p className="text-sm font-medium text-gray-700">Listing status</p>
                  <label className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Visible to shoppers</span>
                    <button
                      type="button"
                      onClick={() => onChange("isActive", !formState.isActive)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        formState.isActive ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                          formState.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <PackagePlus className="h-4 w-4" />
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

const ProductDetailsModal = ({ open, product, onClose, onEdit, onThumbnailChange }) => {
  if (!open || !product) return null;

  const inventoryState = getInventoryState(product);
  const listingState = product.isActive === false ? "inactive" : "active";
  const productImageItems = getProductImageItems(product);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Product View"
      subtitle="A richer product surface that stays visually aligned with your vendor dashboard."
      width="max-w-5xl"
    >
      <div className="grid gap-6 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="h-72 w-full bg-gray-50 object-cover"
          />
          {productImageItems.length > 0 && (
            <div className="grid grid-cols-4 gap-2 border-b border-gray-100 p-3">
              {productImageItems.slice(0, 8).map((image, index) => {
                const isThumbnail = index === 0;

                return (
                  <div
                    key={`${image.url}-${index}`}
                    className={`relative rounded-xl ${
                      isThumbnail ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="h-16 w-full rounded-xl border border-gray-100 bg-gray-50 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onThumbnailChange(product, getImageKey(image, index))}
                      className={`absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition ${
                        isThumbnail
                          ? "bg-blue-600 text-white"
                          : "bg-white/95 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                      aria-label={`Use image ${index + 1} as thumbnail`}
                      title="Use as thumbnail"
                    >
                      {isThumbnail ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-5 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(
                    listingState
                  )}`}
                >
                  {listingState}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(
                    inventoryState
                  )}`}
                >
                  {inventoryState === "in"
                    ? "in stock"
                    : inventoryState === "low"
                      ? "low stock"
                      : "out of stock"}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="mt-2 text-sm text-gray-500">{product.category || "Uncategorized"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Price</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{formatCurrency(product.price)}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Stock</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{product.stock || 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Added</p>
                <p className="mt-2 text-lg font-bold text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {product.description || "No description added for this product yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-600">Catalog Snapshot</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Quick actions</h3>
            <p className="mt-2 text-sm text-gray-500">
              Review the listing and jump straight into edits without leaving the dashboard.
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Edit Product
            </button>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Product signals</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Availability</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {product.isActive === false ? "Hidden from shoppers" : "Visible to shoppers"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Inventory</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {inventoryState === "low"
                    ? "Needs attention soon"
                    : inventoryState === "out"
                      ? "Restock required"
                      : "Healthy stock level"}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Image Status</p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {product.images?.[0] ? "Image attached to listing" : "No product image uploaded"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

const DeleteProductModal = ({ open, product, onClose, onConfirm, deleting }) => {
  if (!open || !product) return null;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Delete Product"
      subtitle="Use the same calm confirmation surface before removing a listing."
      width="max-w-2xl"
    >
      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Remove this listing?</h3>
              <p className="mt-2 text-sm leading-6 text-red-800">
                <span className="font-semibold">{product.name}</span> will be removed from this
                dashboard view. This action should only be used when you are sure the listing is no
                longer needed.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="h-20 w-20 rounded-2xl border border-gray-100 bg-gray-50 object-cover"
            />
            <div>
              <h4 className="text-base font-semibold text-gray-900">{product.name}</h4>
              <p className="mt-1 text-sm text-gray-500">{product.category || "Uncategorized"}</p>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {formatCurrency(product.price)} • {product.stock || 0} in stock
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Keep Product
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Product"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const Products = () => {
  const [products, setProducts] = useState(sampleProducts.map(normalizeProduct));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    limit: 5,
    total: sampleProducts.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [usingServerPagination, setUsingServerPagination] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const revokeFormObjectUrls = () => {
    if (!formState.imageFiles?.length) return;

    formState.imagePreviews
      ?.filter((image) => image.startsWith("blob:"))
      .forEach((image) => URL.revokeObjectURL(image));
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let isMounted = true;

    const fetchVendorProducts = async () => {
      try {
        setLoading((current) => current);
        setError("");

        const apiSort = getApiSortParams(sort);
        const { data } = await axios.get(`${API_URL}/vendor/products`, {
          params: {
            page,
            limit,
            search: search || undefined,
            category: category !== "all" ? category : undefined,
            sort: apiSort.sort,
            order: apiSort.order,
          },
          withCredentials: true,
        });

        const nextProducts = data?.products || data?.data || [];
        if (isMounted && Array.isArray(nextProducts)) {
          const normalizedProducts = nextProducts.map(normalizeProduct);
          setProducts(normalizedProducts);
          const pagination = data?.pagination;

          if (pagination) {
            const paginationPage = getPaginationNumber(
              pagination.page,
              pagination.currentPage,
              pagination.current,
              page
            );
            const paginationLimit = getPaginationNumber(
              pagination.limit,
              pagination.pageSize,
              pagination.perPage,
              limit
            );
            const paginationTotal = getPaginationNumber(
              pagination.total,
              pagination.totalProducts,
              pagination.totalItems,
              pagination.count
            );
            const paginationTotalPages =
              getPaginationNumber(pagination.totalPages, pagination.pages, pagination.pageCount) ||
              (paginationTotal
                ? Math.max(Math.ceil(paginationTotal / (paginationLimit || limit)), 1)
                : undefined);
            const hasServerTotals =
              Boolean(paginationTotal && paginationTotal > normalizedProducts.length) ||
              Boolean(paginationTotalPages && paginationTotalPages > 1);
            const backendReturnedAllProducts =
              normalizedProducts.length > (paginationLimit || limit) && !hasServerTotals;
            const total = paginationTotal || normalizedProducts.length;
            const totalPages =
              paginationTotalPages ||
              Math.max(Math.ceil(total / (paginationLimit || limit)), 1);
            const currentPage = paginationPage || page;

            setUsingServerPagination(!backendReturnedAllProducts);
            setServerPagination({
              page: currentPage,
              limit: paginationLimit || limit,
              total,
              totalPages,
              hasNextPage:
                paginationTotalPages || paginationTotal
                  ? currentPage < totalPages
                  : Boolean(pagination.hasNextPage) ||
                    normalizedProducts.length >= (paginationLimit || limit),
              hasPrevPage:
                paginationTotalPages || paginationTotal
                  ? currentPage > 1
                  : Boolean(pagination.hasPrevPage),
            });
          } else {
            setUsingServerPagination(false);
            setServerPagination({
              page: 1,
              limit,
              total: normalizedProducts.length,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          const fallbackProducts = sampleProducts.map(normalizeProduct);
          setProducts(fallbackProducts);
          setUsingServerPagination(false);
          setServerPagination({
            page: 1,
            limit,
            total: fallbackProducts.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
          setError(
            err.response?.data?.message ||
              "Vendor product list is using sample data until the vendor-specific products controller is available."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVendorProducts();

    return () => {
      isMounted = false;
    };
  }, [page, limit, search, category, status, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, sort, limit]);

  useEffect(() => {
    if (!feedback) return undefined;

    const timeout = window.setTimeout(() => setFeedback(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const categories = useMemo(() => {
    const values = new Set(PRODUCT_CATEGORIES);
    products
      .map((product) => product.category)
      .filter(Boolean)
      .forEach((value) => values.add(value));

    return ["all", ...values];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (usingServerPagination) {
      return products;
    }

    const normalizedSearch = search.trim().toLowerCase();

    const next = products.filter((product) => {
      const inventoryState = getInventoryState(product);
      const productStatus = product.isActive === false ? "inactive" : "active";

      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.category?.toLowerCase().includes(normalizedSearch);

      const matchesCategory = category === "all" || product.category === category;

      const matchesStatus =
        status === "all" || inventoryState === status || productStatus === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    next.sort((a, b) => {
      if (sort === "price-low") return (a.price || 0) - (b.price || 0);
      if (sort === "price-high") return (b.price || 0) - (a.price || 0);
      if (sort === "stock-low") return (a.stock || 0) - (b.stock || 0);
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return next;
  }, [products, search, category, status, sort, usingServerPagination]);

  const summary = useMemo(() => {
    const activeCount = products.filter((product) => product.isActive !== false).length;
    const lowStockCount = products.filter(
      (product) => getInventoryState(product) === "low"
    ).length;
    const outOfStockCount = products.filter(
      (product) => getInventoryState(product) === "out"
    ).length;

    return {
      total: products.length,
      active: activeCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }, [products]);

  const localTotalPages = Math.max(Math.ceil(filteredProducts.length / limit), 1);
  const visiblePagination = usingServerPagination
    ? serverPagination
    : {
        page: Math.min(page, localTotalPages),
        limit,
        total: filteredProducts.length,
        totalPages: localTotalPages,
        hasNextPage: page < localTotalPages,
        hasPrevPage: page > 1,
      };
  const visibleProducts = usingServerPagination
    ? filteredProducts
    : filteredProducts.slice(
        (visiblePagination.page - 1) * limit,
        visiblePagination.page * limit
      );

  useEffect(() => {
    if (!usingServerPagination && page > localTotalPages) {
      setPage(localTotalPages);
    }
  }, [localTotalPages, page, usingServerPagination]);

  const startItem = visibleProducts.length
    ? (visiblePagination.page - 1) * visiblePagination.limit + 1
    : 0;
  const endItem = visibleProducts.length ? startItem + visibleProducts.length - 1 : 0;

  const isFormModalOpen = formMode === "add" || formMode === "edit";
  const isViewModalOpen = formMode === "view";
  const isDeleteModalOpen = formMode === "delete";

  const closeModal = ({ revokePreviews = true } = {}) => {
    if (revokePreviews) {
      revokeFormObjectUrls();
    }

    setFormMode(null);
    setSelectedProduct(null);
    setFormState(emptyFormState);
    setActionLoading(false);
  };

  const openAddModal = () => {
    revokeFormObjectUrls();

    setSelectedProduct(null);
    setFormState(emptyFormState);
    setFormMode("add");
  };

  const openEditModal = (product) => {
    revokeFormObjectUrls();

    setSelectedProduct(product);
    setFormState(toFormState(product));
    setFormMode("edit");
  };

  const openViewModal = (product) => {
    setSelectedProduct(product);
    setFormMode("view");
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setFormMode("delete");
  };

  const handleFormChange = (field, value) => {
    if (field === "removeImage") {
      setFormState((current) => {
        const imageToRemove = current.imageItems?.[value];
        const removedImageKey = getImageKey(imageToRemove, value);

        if (imageToRemove?.url?.startsWith("blob:")) {
          URL.revokeObjectURL(imageToRemove.url);
        }

        const imageItems = current.imageItems.filter((_, index) => index !== value);
        const imagePreviews = imageItems.map((image) => image.url);
        const imageFiles = imageItems.filter((image) => image.file).map((image) => image.file);
        const thumbnailKey =
          current.thumbnailKey && current.thumbnailKey !== removedImageKey
            ? current.thumbnailKey
            : imageItems[0]
              ? getImageKey(imageItems[0], 0)
              : "";
        const removedImages = imageToRemove && !imageToRemove.file
          ? [
              ...current.removedImages,
              {
                public_id: imageToRemove.public_id,
                url: imageToRemove.url,
              },
            ]
          : current.removedImages;

        return {
          ...current,
          imageItems,
          imageFiles,
          imageName: imageFiles.map((file) => file.name).join(", "),
          imagePreview: imagePreviews[0] || "",
          imagePreviews,
          removedImages,
          thumbnailKey,
        };
      });
      return;
    }

    if (field === "thumbnailImage") {
      setFormState((current) => ({
        ...current,
        thumbnailKey: value,
        imagePreview:
          current.imageItems.find((image, index) => getImageKey(image, index) === value)?.url ||
          current.imagePreview,
      }));
      return;
    }

    if (field === "imageFiles") {
      revokeFormObjectUrls();

      if (!value.length) {
        const existingImageItems = getProductImageItems(selectedProduct).filter(
          (image) =>
            !formState.removedImages.some(
              (removedImage) =>
                removedImage.public_id === image.public_id || removedImage.url === image.url
            )
        );
        const existingImages = existingImageItems.map((image) => image.url);
        setFormState((current) => ({
          ...current,
          imageItems: existingImageItems,
          imageFiles: [],
          imageName: "",
          imagePreview: existingImages[0] || "",
          imagePreviews: existingImages,
          thumbnailKey:
            existingImageItems.find(
              (image, index) => getImageKey(image, index) === current.thumbnailKey
            )
              ? current.thumbnailKey
              : existingImageItems[0]
                ? getImageKey(existingImageItems[0], 0)
                : "",
        }));
        return;
      }

      const existingImageItems = formState.imageItems.filter((image) => !image.file);
      const newImageItems = value.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      const imageItems = [...existingImageItems, ...newImageItems];
      const imagePreviews = imageItems.map((image) => image.url);
      setFormState((current) => ({
        ...current,
        imageItems,
        imageFiles: value,
        imageName: value.map((file) => file.name).join(", "),
        imagePreview: imagePreviews[0] || "",
        imagePreviews,
        thumbnailKey: current.thumbnailKey || getImageKey(imageItems[0], 0),
      }));
      return;
    }

    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError("");

    const payload = createLocalProductPayload(formState, selectedProduct);
    const formData = createProductFormData(formState);

    try {
      if (formMode === "edit" && selectedProduct?._id) {
        const { data } = await axios.patch(
          `${API_URL}/products/${selectedProduct._id}`,
          formData,
          { withCredentials: true }
        );
        const nextProduct = normalizeProduct(data?.product || data?.data || payload);
        setProducts((current) =>
          current.map((product) =>
            product._id === selectedProduct._id ? nextProduct : product
          )
        );
        setFeedback("Product updated successfully.");
      } else {
        const { data } = await axios.post(`${API_URL}/products`, formData, {
          withCredentials: true,
        });
        const nextProduct = normalizeProduct(data?.product || data?.data || payload);
        setProducts((current) => [nextProduct, ...current]);
        setFeedback("Product created successfully.");
      }

      closeModal();
    } catch (err) {
      if (formMode === "edit" && selectedProduct?._id) {
        setProducts((current) =>
          current.map((product) =>
            product._id === selectedProduct._id ? normalizeProduct(payload) : product
          )
        );
        setFeedback(
          err.response?.data?.message ||
            "Live update endpoint was unavailable, so the product was updated locally."
        );
      } else {
        setProducts((current) => [normalizeProduct(payload), ...current]);
        setFeedback(
          err.response?.data?.message ||
            "Create endpoint was unavailable, so the product was added locally."
        );
      }

      closeModal({ revokePreviews: false });
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct?._id) return;

    setActionLoading(true);
    setError("");

    try {
      await axios.delete(`${API_URL}/products/${selectedProduct._id}`, {
        withCredentials: true,
      });
      setProducts((current) =>
        current.filter((product) => product._id !== selectedProduct._id)
      );
      setFeedback("Product deleted successfully.");
    } catch (err) {
      setProducts((current) =>
        current.filter((product) => product._id !== selectedProduct._id)
      );
      setFeedback(
        err.response?.data?.message ||
          "Delete endpoint was unavailable, so the product was removed locally."
      );
    } finally {
      closeModal();
    }
  };

  const handleThumbnailChange = async (product, thumbnailKey) => {
    if (!product?._id || !thumbnailKey) return;

    const reorderedProduct = {
      ...product,
      images: moveImageToFront(getProductImageItems(product), thumbnailKey).map((image) =>
        image.public_id ? { url: image.url, public_id: image.public_id } : image.url
      ),
    };

    setSelectedProduct(reorderedProduct);
    setProducts((current) =>
      current.map((item) => (item._id === product._id ? normalizeProduct(reorderedProduct) : item))
    );

    try {
      const { data } = await axios.put(
        `${API_URL}/products/${product._id}`,
        createProductFormDataFromProduct(product, thumbnailKey),
        { withCredentials: true }
      );
      const nextProduct = normalizeProduct(data?.product || data?.data || reorderedProduct);

      setSelectedProduct(nextProduct);
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? nextProduct : item))
      );
      setFeedback("Thumbnail updated successfully.");
    } catch (err) {
      setFeedback(
        err.response?.data?.message ||
          "Thumbnail changed locally, but the update endpoint did not save the order."
      );
    }
  };

  if (loading) {
    return <ProductsSkeleton />;
  }

  return (
  <>
    <div className="space-y-4">
      {/* Compact Header */}
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <div className="px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Vendor Products</p>
              <h1 className="text-xl font-bold text-gray-900">Manage catalog</h1>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm shadow-blue-100"
            >
              <PackagePlus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {(error || feedback) && (
            <div className="mt-3 space-y-2">
              {error && <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{error}</div>}
              {feedback && <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">{feedback}</div>}
            </div>
          )}
        </div>
      </section>

      {/* Tighter Summary Cards */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total"
          value={summary.total}
          helper={`${summary.active} active`}
        />
        <SummaryCard
          title="Low Stock"
          value={summary.lowStock}
          helper="Below threshold"
        />
        <SummaryCard
          title="Out of Stock"
          value={summary.outOfStock}
          helper="Unavailable"
        />
        <SummaryCard
          title="Visible"
          value={visiblePagination.total}
          helper="Matching filters"
        />
      </section>

      {/* One-Line Filter Bar */}
      <section className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* Search - Takes up most space */}
          <div className="relative flex-[2.5]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or category..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          {/* Filters - Tightly packed */}
          <div className="flex flex-wrap items-center gap-2 flex-[3]">
            <div className="relative flex-1 min-w-[130px]">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-2 text-sm outline-none transition focus:border-blue-400"
              >
                {categories.map((val) => (
                  <option key={val} value={val}>{val === "all" ? "All Categories" : val}</option>
                ))}
              </select>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-2 text-sm outline-none transition focus:border-blue-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex-1 min-w-[120px] rounded-lg border border-gray-200 bg-gray-50 py-2 px-2 text-sm outline-none transition focus:border-blue-400"
            >
              <option value="latest">Latest</option>
              <option value="name">Name</option>
              <option value="price-low">Price: Low-High</option>
              <option value="price-high">Price: High-Low</option>
              <option value="stock-low">Stock: Low-High</option>
            </select>
          </div>
        </div>
      </section>

      {/* Compact Product List */}
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
          <h2 className="text-sm font-bold text-gray-900">Products List</h2>
          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
            {visiblePagination.total} Items
          </span>
        </div>

        {visibleProducts.length ? (
          <div className="divide-y divide-gray-50">
            {visibleProducts.map((product) => {
              const inventoryState = getInventoryState(product);
              const listingState = product.isActive === false ? "inactive" : "active";

              return (
                <article key={product._id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="h-14 w-14 rounded-lg border border-gray-100 bg-gray-50 object-cover"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.category || "Uncategorized"}</p>
                      <div className="mt-1 flex gap-1">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${getStatusBadgeClasses(listingState)}`}>
                          {listingState}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${getStatusBadgeClasses(inventoryState)}`}>
                          {inventoryState === "in" ? "in stock" : inventoryState === "low" ? "low stock" : "out of stock"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Price</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Stock</p>
                        <p className="text-sm font-bold text-gray-900">{product.stock || 0}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Added</p>
                        <p className="text-sm font-bold text-gray-900">{formatDate(product.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openViewModal(product)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEditModal(product)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => openDeleteModal(product)} className="p-2 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <PackagePlus className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">No products found</h3>
          </div>
        )}

        {/* Streamlined Pagination */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500">
              {startItem}-{endItem} of {visiblePagination.total}
            </p>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none"
            >
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / pg</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!visiblePagination.hasPrevPage}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-gray-700">
              {visiblePagination.page} / {visiblePagination.totalPages}
            </span>
            <button
              disabled={!visiblePagination.hasNextPage}
              onClick={() => setPage(p => Math.min(p + 1, visiblePagination.totalPages))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>

    {/* Modals remain same logic-wise */}
    <ProductFormModal open={isFormModalOpen} mode={formMode} formState={formState} onChange={handleFormChange} onSubmit={handleSubmitProduct} onClose={closeModal} saving={actionLoading} />
    <ProductDetailsModal open={isViewModalOpen} product={selectedProduct} onClose={closeModal} onThumbnailChange={handleThumbnailChange} onEdit={() => selectedProduct && openEditModal(selectedProduct)} />
    <DeleteProductModal open={isDeleteModalOpen} product={selectedProduct} onClose={closeModal} onConfirm={handleDeleteProduct} deleting={actionLoading} />
  </>
);
};

export default Products;
