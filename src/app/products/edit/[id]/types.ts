export type GroupProductData = {
  id: number;
  uuid: string;
  group_name: string;
  description: string;
  main_img_url: string[];
  create_Date: string;
  products: ProductData[];
  categories?: { id: number; name: string }[]; 
  collections?: { id: number; name: string }[];
};

export type ProductData = {
  id: number;
  uuid: string;
  sku: string;
  name_sku: string;
  quantity: number;
  make_price: number | null;
  price_origin: number;
  product_width: number | null;
  product_length: number | null; 
  product_heigth: number | null;
  product_weight: number | null;
  img_url: string | null;
  group_name: string;
  create_Date: string;
  update_date: string;
  categories: { id: number; name: string }[];
  collections: { id: number; name: string }[];
  flash_sale: {
    id: number;
    flash_sale_price: number;
    flash_sale_per: number;
    start_date: string;
    end_date: string;
    quantity: number;
    status: string;
  } | null;
};

export type EditableProductData = {
  id: number;
  sku: string;
  name_sku: string;
  quantity: number;
  make_price: number | null;
  price_origin: number;
  product_width: number | null;
  product_length: number | null; 
  product_heigth: number | null;
  product_weight: number | null;
  img_url: string | null;
  categories: string[];
  collections: string[];
  isEditing: boolean;
  isDeleting: boolean;
};

export type Category = {
  id: number;
  name: string;
};

export type Collection = {
  id: number;
  name: string;
};