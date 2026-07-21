import json
path = 'C:/Users/ASUS/Downloads/Qwen3-VL-Embedding-2B/tokenizer_config.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Qwen3-VL chat template
data['chat_template'] = "{% set image_count = namespace(value=0) %}{% set video_count = namespace(value=0) %}{% for message in messages %}{% if loop.first and message['role'] != 'system' %}<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n{% endif %}<|im_start|>{{ message['role'] }}\n{% if message['content'] is string %}{{ message['content'] }}<|im_end|>\n{% else %}{% for content in message['content'] %}{% if content['type'] == 'image' or 'image' in content %}{% set image_count.value = image_count.value + 1 %}<|vision_start|><|image_pad|><|vision_end|>{% elif content['type'] == 'video' or 'video' in content %}{% set video_count.value = video_count.value + 1 %}<|vision_start|><|video_pad|><|vision_end|>{% elif content['type'] == 'text' or 'text' in content %}{{ content['text'] }}{% endif %}{% endfor %}<|im_end|>\n{% endif %}{% endfor %}{% if add_generation_prompt %}<|im_start|>assistant\n{% endif %}"

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
print("Chat template added successfully.")
