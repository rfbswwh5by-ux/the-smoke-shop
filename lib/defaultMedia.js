// Fallback photography used until the shop owner uploads their own images.
// One dedicated image per placement.
export const MEDIA = {
  hero: "/media/hero.jpg",
  store: "/media/store.jpg",
  disposables: "/media/disposables.jpg",
  devices: "/media/devices.jpg",
  eliquids: "/media/eliquids.jpg",
  coils: "/media/coils.jpg",
  accessories: "/media/accessories.jpg",
  components: "/media/components.jpg",
  salts: "/media/salts.jpg",
  pods: "/media/pods.jpg",
};

export function categoryImage(name) {
  const key = String(name || "").toLowerCase();
  if (key.includes("disposable")) return MEDIA.disposables;
  if (key.includes("salt")) return MEDIA.salts;
  if (key.includes("liquid") || key.includes("juice")) return MEDIA.eliquids;
  if (key.includes("coil")) return MEDIA.coils;
  if (key.includes("access") || key.includes("tool")) return MEDIA.accessories;
  if (key.includes("replacement") || key.includes("glass") || key.includes("tank")) return MEDIA.components;
  if (key.includes("device") || key.includes("mod") || key.includes("kit") || key.includes("pod")) return MEDIA.devices;
  return MEDIA.devices;
}

export const productImage = (imageUrl, category) => imageUrl || categoryImage(category);