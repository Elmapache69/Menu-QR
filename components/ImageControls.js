"use client";

import { useId } from "react";

export function ImageRange({ label, value, onChange, min = 0, max = 100, step = 1, suffix = "%" }) {
  const id = useId();
  return <div className="image-range">
    <div><label htmlFor={id}>{label}</label><output htmlFor={id}>{value}{suffix}</output></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value}
      onChange={(event) => onChange(Number(event.target.value))} />
  </div>;
}

export function ImageChoices({ label, value, onChange, options }) {
  const name = useId();
  return <fieldset className="image-choices">
    <legend>{label}</legend>
    <div>{options.map(([key, title, description]) => <label key={key} data-selected={value === key}>
      <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
      <span>{title}{description && <small>{description}</small>}</span>
    </label>)}</div>
  </fieldset>;
}
