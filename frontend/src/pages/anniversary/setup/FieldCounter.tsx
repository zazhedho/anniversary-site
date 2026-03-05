type FieldCounterProps = {
  value: string;
  max: number;
};

export default function FieldCounter({ value, max }: FieldCounterProps) {
  return <span className="text-[11px] font-medium text-[#2b2220]/55">{value.length}/{max}</span>;
}
