import { AutoTokenizer, AutoModelForSequenceClassification } from '@xenova/transformers';

(async () => {
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-reranker-base');
    const model = await AutoModelForSequenceClassification.from_pretrained('Xenova/bge-reranker-base', {quantized: true});
    const inputs1 = tokenizer('Show the implementation of the Checkbox UI component', {
        text_pair: 'import { Checkbox } from "../../../components/checkbox";',
        padding: true,
        truncation: true
    });
    const {logits: l1} = await model(inputs1);
    console.log('LOGITS1:', l1.data);
    
    const inputs2 = tokenizer('Show the implementation of the Checkbox UI component', {
        text_pair: '<Checkbox checked={settings.canvasSpecsEnabled} onChange={(checked) => updateSetting("canvasSpecsEnabled", checked)} />',
        padding: true,
        truncation: true
    });
    const {logits: l2} = await model(inputs2);
    console.log('LOGITS2:', l2.data);
})();
