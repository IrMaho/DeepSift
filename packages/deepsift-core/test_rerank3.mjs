import { AutoTokenizer, AutoModelForSequenceClassification } from '@xenova/transformers';

(async () => {
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-reranker-base');
    const model = await AutoModelForSequenceClassification.from_pretrained('Xenova/bge-reranker-base', {quantized: true});
    const inputs1 = tokenizer('Show the implementation of the Checkbox UI component', {
        text_pair: 'This is the implementation of the Checkbox component:\nexport function Checkbox({ checked, onChange }) { return <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> }',
        padding: true,
        truncation: true
    });
    const {logits: l1} = await model(inputs1);
    console.log('LOGITS_WITH_PREFIX:', l1.data);
})();
