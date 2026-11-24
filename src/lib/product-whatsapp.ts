import { formatBRL, WHATSAPP_URL } from "./constants.ts";
import { formatCep, normalizeCepDigits, type CepCoverageResult } from "./delivery-coverage.ts";

export interface ProductWhatsappParams {
  productName: string;
  variant?: string | null;
  color?: string | null;
  pixPrice?: number;
  installmentCount?: number;
  installmentValue?: number;
  cardTotal?: number;
  cepResult?: CepCoverageResult | null;
}

function readableCepStatus(result: CepCoverageResult): string {
  switch (result.status) {
    case "eligible":
      return `frete grátis em ${result.deadlineLabel ?? "até 7 dias úteis"}`;
    case "excluded_belford_roxo":
      return "Belford Roxo fora da área de entrega";
    case "out_of_area":
      return "fora da área padrão de 30 km";
    default:
      return result.regionLabel ?? "CEP consultado";
  }
}

export function buildProductWhatsappMessage(params: ProductWhatsappParams): string {
  const lines = [`Olá! Quero consultar disponibilidade e entrega para: ${params.productName}.`];

  const choiceParts = [
    params.variant ? `Opção: ${params.variant}` : "",
    params.color ? `Cor: ${params.color}` : "",
  ].filter(Boolean);
  if (choiceParts.length > 0) {
    lines.push(`${choiceParts.join(" · ")}.`);
  }

  if (
    typeof params.pixPrice === "number" &&
    Number.isFinite(params.pixPrice) &&
    params.pixPrice > 0
  ) {
    const installmentPart =
      params.installmentCount &&
      typeof params.installmentValue === "number" &&
      typeof params.cardTotal === "number"
        ? ` | Cartão: ${params.installmentCount}x de ${formatBRL(params.installmentValue)} (total ${formatBRL(params.cardTotal)}).`
        : ".";
    lines.push(`À vista no Pix: ${formatBRL(params.pixPrice)}${installmentPart}`);
  }

  if (params.cepResult) {
    const digits = normalizeCepDigits(params.cepResult.cep);
    if (
      digits.length === 8 &&
      params.cepResult.status !== "invalid" &&
      params.cepResult.status !== "not_found"
    ) {
      const addressParts = [
        params.cepResult.address?.bairro,
        [params.cepResult.address?.localidade, params.cepResult.address?.uf]
          .filter(Boolean)
          .join(" - "),
      ].filter(Boolean);
      const locationPrefix = addressParts.length ? `${addressParts.join(", ")} — ` : "";
      lines.push(
        `CEP consultado: ${formatCep(digits)} (${locationPrefix}${readableCepStatus(params.cepResult)}).`,
      );
    }
  }

  return lines.join("\n");
}

export function buildProductWhatsappUrl(params: ProductWhatsappParams): string {
  return `${WHATSAPP_URL}?text=${encodeURIComponent(buildProductWhatsappMessage(params))}`;
}
