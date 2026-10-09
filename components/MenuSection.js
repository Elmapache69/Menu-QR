import MenuPhoto from "@/components/MenuPhoto";
import CategoryImageBlock from "@/components/CategoryImageBlock";
import { categoryKicker, formatCLP, resolveCategoryImageHeight } from "@/lib/format";

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

  return (
    <section className="menu-section" id={preview ? undefined : `cat-${category}`}
      data-cat-section={preview ? undefined : category}>
      <div className="menu-section-heading">
        <span className="menu-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          {categoryKicker(category) && <p className="menu-eyebrow mb-1">{categoryKicker(category)}</p>}
          <h2 className="menu-section-title">{category}</h2>
        </div>
        <span className="menu-section-count" aria-label={`${items.length} platos`}>{items.length}</span>
      </div>
      {image?.imageUrl ? (
        <CategoryImageBlock imageUrl={image.imageUrl} alt={category} shape={image.shape}
          height={resolveCategoryImageHeight(image, items.length)} position={image.position}
          gap={image.textGap} layout={image.layout} focusY={image.focusY}>
          {itemList}
        </CategoryImageBlock>
      ) : itemList}
    </section>
  );
}
