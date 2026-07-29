import { AutoTokenizer, AutoModelForSequenceClassification } from '@xenova/transformers';

(async () => {
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-reranker-base');
    const model = await AutoModelForSequenceClassification.from_pretrained('Xenova/bge-reranker-base', {quantized: true});
    
    // Test the True Implementation
    const payload1 = `File: src/components/checkbox.tsx\nType: function\nSymbol: Checkbox\nCode:\nexport function Checkbox({ checked, onChange }) { return <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> }`;
    const inputs1 = tokenizer('Show the implementation of the Checkbox UI component', { text_pair: payload1, padding: true, truncation: true });
    const {logits: l1} = await model(inputs1);
    console.log('LOGITS_TRUE_IMPL:', l1.data);
    
    // Test the Usage
    const payload2 = `File: src/features/design/components/settings-view.tsx\nType: component\nSymbol: SettingsView\nCode:\n<Checkbox checked={settings.canvasSpecsEnabled} onChange={(checked) => updateSetting("canvasSpecsEnabled", checked)} />`;
    const inputs2 = tokenizer('Show the implementation of the Checkbox UI component', { text_pair: payload2, padding: true, truncation: true });
    const {logits: l2} = await model(inputs2);
    console.log('LOGITS_USAGE:', l2.data);
})();
