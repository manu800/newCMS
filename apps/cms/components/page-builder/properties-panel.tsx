"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DATA_SOURCE_LABELS, STRUCTURE_ELEMENTS } from "@cms-pwa/component-schema";
import type {
  CmsComponent,
  DataSource,
  DataSourceType,
  DesignContract,
  DesignOverride,
  Section,
  StructureElement,
} from "@cms-pwa/shared-types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";



const DATA_SOURCE_TYPES: DataSourceType[] = [
  "latest",
  "trending",
  "breaking",
  "category",
  "tag",
  "manual",
  "video",
  "search",
];

export function PropertiesPanel({
  section,
  component,
  onChange,
}: {
  section: Section;
  component: CmsComponent | undefined;
  onChange: (patch: Partial<Section>) => void;
}) {
  const dataSource: DataSource = section.data_source ?? { type: "manual", limit: 10 };

  const updateDataSource = (patch: Partial<DataSource>) =>
    onChange({ data_source: { ...dataSource, ...patch } });

  const updateProp = (name: string, value: unknown) =>
    onChange({ props: { ...section.props, [name]: value } });

  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const design: DesignOverride = section.design?.[device] ?? {};
  const contract: DesignContract =
    component?.design_contract ?? {
      typography: false,
      colors: false,
      spacing: false,
      border: false,
      shadow: false,
      cursor: false,
      layout: false,
      images: false,
      positioning: false,
    };

  const updateDesign = (patch: Partial<DesignOverride>) =>
    onChange({
      design: {
        ...section.design,
        [device]: { ...design, ...patch },
      },
    });

  // Only components the PWA renderer actually knows how to reorder/hide-by-element
  // appear here — see STRUCTURE_ELEMENTS in @cms-pwa/component-schema.
  const structureCatalog = STRUCTURE_ELEMENTS[section.type];
  const structure: StructureElement[] =
    section.structure ?? (structureCatalog ? structureCatalog.map((el) => ({ element_id: el.id, enabled: true })) : []);

  const updateStructure = (next: StructureElement[]) => onChange({ structure: next });
  const toggleElement = (elementId: string, enabled: boolean) =>
    updateStructure(structure.map((el) => (el.element_id === elementId ? { ...el, enabled } : el)));
  const moveElement = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= structure.length) return;
    const next = [...structure];
    [next[index], next[target]] = [next[target], next[index]];
    updateStructure(next);
  };

  const titleInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Only the dedicated Image component should autofocus its Image field — for a
  // multi-field component like Hero (which also happens to have an image field),
  // Title remains the more useful thing to land the cursor in.
  const primaryImageField = component?.type === "image" ? component.fields.find((f) => f.type === "image") : undefined;

  useEffect(() => {
    if (primaryImageField) {
      imageInputRef.current?.focus();
    } else {
      titleInputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  return (
    <div className="space-y-6 cursor-row-resize h-200 overflow-y-auto overflow-x-hidden p-2">
      <div>
        <h3 className="mb-3 text-sm font-semibold">{component?.name ?? section.type}</h3>
        <div className="space-y-3">
          <Field label="Title">
            <Input ref={titleInputRef} value={section.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          {component && component.variants.length > 0 && (
            <Field label="Variant">
              <Select value={section.variant} onValueChange={(v: string) => onChange({ variant: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {component.variants.map((v) => (
                    <SelectItem key={v.slug} value={v.slug}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      </div>

      {structureCatalog && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Structure</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Reorder or hide this component&apos;s elements. Same for every device — pair with Visibility (in
            Design, per-device) if you only want to hide an element on mobile or desktop.
          </p>
          <div className="space-y-1.5">
            {structure.map((el, index) => {
              const meta = structureCatalog.find((c) => c.id === el.element_id);
              return (
                <div
                  key={el.element_id}
                  className={`flex items-center justify-between rounded-md border p-2 ${el.enabled ? "" : "opacity-50"}`}
                >
                  <span className="text-sm">{meta?.label ?? el.element_id}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => moveElement(index, -1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === structure.length - 1}
                      onClick={() => moveElement(index, 1)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Switch checked={el.enabled} onCheckedChange={(v: boolean) => toggleElement(el.element_id, v)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {component && component.fields.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Content</h3>
          <div className="space-y-3">
            {component.fields.map((field) => (
              <Field key={field.name} label={field.label}>
                <DynamicField
                  type={field.type}
                  options={field.options}
                  value={section.props?.[field.name]}
                  onChange={(v) => updateProp(field.name, v)}
                  inputRef={field === primaryImageField ? imageInputRef : undefined}
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Design</h3>
            <Tabs value={device} onValueChange={(v: string) => setDevice(v as "mobile" | "desktop")}>
              <TabsList className="h-7">
                <TabsTrigger value="mobile" className="text-xs">
                  Mobile
                </TabsTrigger>
                <TabsTrigger value="desktop" className="text-xs">
                  Desktop
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Overrides the theme for this section only, on {device}. Leave a field blank to keep using the theme
            default.
          </p>
          <div className="space-y-3">
            <Field label={`Visibility on ${device}`}>
              <div className="flex items-center gap-2">
                <Switch checked={!!design.hidden} onCheckedChange={(v: boolean) => updateDesign({ hidden: v || undefined })} />
                <span className="text-xs text-muted-foreground">{design.hidden ? `Hidden on ${device}` : `Visible on ${device}`}</span>
              </div>
            </Field>
            {contract.typography && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Font Size (px)">
                    <Input
                      type="number"
                      value={design.font_size ?? ""}
                      onChange={(e) => updateDesign({ font_size: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field label="Font Weight">
                    <Input
                      type="number"
                      step={100}
                      value={design.font_weight ?? ""}
                      onChange={(e) => updateDesign({ font_weight: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                </div>
                <Field label="Text Align">
                  <Select
                    value={design.text_align ?? "unset"}
                    onValueChange={(v: string) => updateDesign({ text_align: v === "unset" ? undefined : (v as "left" | "center" | "right") })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Theme default</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {contract.colors && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Text Color">
                  <Input
                    type="color"
                    value={design.text_color ?? "#000000"}
                    onChange={(e) => updateDesign({ text_color: e.target.value })}
                  />
                </Field>
                <Field label="Background Color">
                  <Input
                    type="color"
                    value={design.background_color ?? "#ffffff"}
                    onChange={(e) => updateDesign({ background_color: e.target.value })}
                  />
                </Field>
              </div>
            )}

            {contract.spacing && (
              <div className="grid grid-cols-4 gap-2">
                {(["padding_top", "padding_right", "padding_bottom", "padding_left"] as const).map((key) => (
                  <Field key={key} label={key.replace("padding_", "")}>
                    <Input
                      type="number"
                      value={design[key] ?? ""}
                      onChange={(e) => updateDesign({ [key]: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                ))}
              </div>
            )}

            {contract.border && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Radius (px)">
                    <Input
                      type="number"
                      value={design.border_radius ?? ""}
                      onChange={(e) => updateDesign({ border_radius: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field label="Width (px)">
                    <Input
                      type="number"
                      value={design.border_width ?? ""}
                      onChange={(e) => updateDesign({ border_width: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field label="Color">
                    <Input
                      type="color"
                      value={design.border_color ?? "#000000"}
                      onChange={(e) => updateDesign({ border_color: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ["border_radius_top_left", "TL"],
                      ["border_radius_top_right", "TR"],
                      ["border_radius_bottom_right", "BR"],
                      ["border_radius_bottom_left", "BL"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} label={`Corner ${label}`}>
                      <Input
                        type="number"
                        placeholder="—"
                        value={design[key] ?? ""}
                        onChange={(e) => updateDesign({ [key]: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </Field>
                  ))}
                </div>
              </>
            )}

            {contract.cursor && (
              <Field label="Cursor">
                <Select
                  value={design.cursor ?? "unset"}
                  onValueChange={(v: string) => updateDesign({ cursor: v === "unset" ? undefined : (v as DesignOverride["cursor"]) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Theme default</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="pointer">Pointer</SelectItem>
                    <SelectItem value="wait">Wait</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="move">Move</SelectItem>
                    <SelectItem value="grab">Grab</SelectItem>
                    <SelectItem value="grabbing">Grabbing</SelectItem>
                    <SelectItem value="crosshair">Crosshair</SelectItem>
                    <SelectItem value="not-allowed">Not allowed</SelectItem>
                    <SelectItem value="zoom-in">Zoom in</SelectItem>
                    <SelectItem value="zoom-out">Zoom out</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            {contract.layout && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Display">
                    <Select
                      value={design.display ?? "unset"}
                      onValueChange={(v: string) => updateDesign({ display: v === "unset" ? undefined : (v as DesignOverride["display"]) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Theme default</SelectItem>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="flex">Flex</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="inline-block">Inline block</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Flex Direction">
                    <Select
                      value={design.flex_direction ?? "unset"}
                      onValueChange={(v: string) => updateDesign({ flex_direction: v === "unset" ? undefined : (v as DesignOverride["flex_direction"]) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Theme default</SelectItem>
                        <SelectItem value="row">Row</SelectItem>
                        <SelectItem value="column">Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Justify Content">
                    <Select
                      value={design.justify_content ?? "unset"}
                      onValueChange={(v: string) => updateDesign({ justify_content: v === "unset" ? undefined : (v as DesignOverride["justify_content"]) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Theme default</SelectItem>
                        <SelectItem value="flex-start">Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="flex-end">End</SelectItem>
                        <SelectItem value="space-between">Space between</SelectItem>
                        <SelectItem value="space-around">Space around</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Align Items">
                    <Select
                      value={design.align_items ?? "unset"}
                      onValueChange={(v: string) => updateDesign({ align_items: v === "unset" ? undefined : (v as DesignOverride["align_items"]) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Theme default</SelectItem>
                        <SelectItem value="flex-start">Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="flex-end">End</SelectItem>
                        <SelectItem value="stretch">Stretch</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Gap (px)">
                    <Input
                      type="number"
                      value={design.gap ?? ""}
                      onChange={(e) => updateDesign({ gap: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </Field>
                  <Field label="Width">
                    <Input
                      placeholder="e.g. 100%"
                      value={design.width ?? ""}
                      onChange={(e) => updateDesign({ width: e.target.value || undefined })}
                    />
                  </Field>
                  <Field label="Height">
                    <Input
                      placeholder="e.g. 300px"
                      value={design.height ?? ""}
                      onChange={(e) => updateDesign({ height: e.target.value || undefined })}
                    />
                  </Field>
                </div>
              </>
            )}

            {contract.images && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Object Fit">
                    <Select
                      value={design.object_fit ?? "unset"}
                      onValueChange={(v: string) => updateDesign({ object_fit: v === "unset" ? undefined : (v as DesignOverride["object_fit"]) })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Default</SelectItem>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="fill">Fill</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Object Position">
                    <Input
                      placeholder="e.g. center, top"
                      value={design.object_position ?? ""}
                      onChange={(e) => updateDesign({ object_position: e.target.value || undefined })}
                    />
                  </Field>
                </div>
                <Field label="Lazy Loading">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={design.lazy_loading ?? true}
                      onCheckedChange={(v: boolean) => updateDesign({ lazy_loading: v })}
                    />
                    <span className="text-xs text-muted-foreground">{(design.lazy_loading ?? true) ? "Lazy" : "Eager"}</span>
                  </div>
                </Field>
              </>
            )}

            {contract.positioning && (
              <>
                <Field label="Position">
                  <Select
                    value={design.position ?? "unset"}
                    onValueChange={(v: string) => updateDesign({ position: v === "unset" ? undefined : (v as DesignOverride["position"]) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unset">Theme default</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="absolute">Absolute</SelectItem>
                      <SelectItem value="sticky">Sticky</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-4 gap-2">
                  {(["position_top", "position_right", "position_bottom", "position_left"] as const).map((key) => (
                    <Field key={key} label={key.replace("position_", "")}>
                      <Input
                        type="number"
                        value={design[key] ?? ""}
                        onChange={(e) => updateDesign({ [key]: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </Field>
                  ))}
                </div>
              </>
            )}

            {contract.shadow && (
              <Field label="Shadow">
                <Select
                  value={design.shadow ?? "unset"}
                  onValueChange={(v: string) => updateDesign({ shadow: v === "unset" ? undefined : (v as DesignOverride["shadow"]) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Theme default</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Data Source</h3>
        <div className="space-y-3">
          <Field label="Source Type">
            <Select value={dataSource.type} onValueChange={(v: string) => updateDataSource({ type: v as DataSourceType })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DATA_SOURCE_LABELS[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Limit">
            <Input
              type="number"
              value={dataSource.limit ?? 10}
              onChange={(e) => updateDataSource({ limit: Number(e.target.value) })}
            />
          </Field>
          {dataSource.type === "category" && (
            <Field label="Category Slug">
              <Input
                value={dataSource.category_slug ?? ""}
                onChange={(e) => updateDataSource({ category_slug: e.target.value })}
              />
            </Field>
          )}
          {dataSource.type === "tag" && (
            <Field label="Tag">
              <Input value={dataSource.tag ?? ""} onChange={(e) => updateDataSource({ tag: e.target.value })} />
            </Field>
          )}
          {dataSource.type === "search" && (
            <Field label="Search Query">
              <Input value={dataSource.query ?? ""} onChange={(e) => updateDataSource({ query: e.target.value })} />
            </Field>
          )}
          {dataSource.type === "manual" && (
            <Field label="Article IDs (comma separated)">
              <Textarea
                value={(dataSource.article_ids ?? []).join(", ")}
                onChange={(e) =>
                  updateDataSource({
                    article_ids: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Responsive Columns</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["mobile", "tablet", "desktop"] as const).map((bp) => (
            <Field key={bp} label={bp}>
              <Input
                type="number"
                min={1}
                value={section.config.columns[bp]}
                onChange={(e) =>
                  onChange({
                    config: {
                      ...section.config,
                      columns: { ...section.config.columns, [bp]: Number(e.target.value) },
                    },
                  })
                }
              />
            </Field>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Spacing</h3>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Top">
            <Input
              type="number"
              value={section.config.spacing.top}
              onChange={(e) =>
                onChange({ config: { ...section.config, spacing: { ...section.config.spacing, top: Number(e.target.value) } } })
              }
            />
          </Field>
          <Field label="Bottom">
            <Input
              type="number"
              value={section.config.spacing.bottom}
              onChange={(e) =>
                onChange({
                  config: { ...section.config, spacing: { ...section.config.spacing, bottom: Number(e.target.value) } },
                })
              }
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs capitalize">{label}</Label>
      {children}
    </div>
  );
}

function DynamicField({
  type,
  options,
  value,
  onChange,
  inputRef,
}: {
  type: string;
  options?: string[];
  value: unknown;
  onChange: (v: unknown) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  switch (type) {
    case "textarea":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <Input type="number" value={(value as number) ?? ""} onChange={(e) => onChange(Number(e.target.value))} />;
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    case "color":
      return <Input type="color" value={(value as string) ?? "#000000"} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <Input type="datetime-local" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "select":
      return (
        <Select value={value as string} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiselect":
      return (
        <Input
          value={Array.isArray(value) ? value.join(", ") : ""}
          placeholder="comma, separated, values"
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      );
    default:
      return <Input ref={inputRef} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
