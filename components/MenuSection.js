import MenuPhoto from "@/components/MenuPhoto";
import CategoryImageBlock from "@/components/CategoryImageBlock";
import { categoryKicker, formatCLP } from "@/lib/format";

export default function MenuSection({ category, items, image, index = 0, preview = false }) {
  const itemList = (
    <ul className="menu-items">
      {items.map((item) => (
        <li key={item.id} className="menu-item">
          {item.imageUrl && <MenuPhoto item={item} preview={preview} />}
          <div className="min-w-0 flex-1">
            <div className="menu-item-heading">
              <h3 className="menu-item-name">{item.name}</h3>
              <span className="menu-item-price">{formatCLP(item.price)}</span>
            </div>
            {item.description && <p className="menu-item-description">{item.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );

  const content = <>
      <div className="menu-section-heading">
        <span className="menu-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          {categoryKicker(category) && <p className="menu-eyebrow mb-1">{categoryKicker(category)}</p>}
          <h2 className="menu-section-title">{category}</h2>
        </div>
        <span className="menu-section-count" aria-label={`${items.length} platos`}>{items.length}</span>
      </div>
      {itemList}
    </>;

  return (
    <section className={`menu-section${image?.imageUrl ? " menu-section-with-background" : ""}`}
      id={preview ? undefined : `cat-${category}`} data-cat-section={preview ? undefined : category}>
      {image?.imageUrl ? (
        <CategoryImageBlock imageUrl={image.imageUrl}
          imageFocusX={image.imageFocusX} imageFocusY={image.imageFocusY}
          overlayShade={image.overlayShade}>
          {content}
        </CategoryImageBlock>
      ) : content}
    </section>
  );
}
