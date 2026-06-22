import json

transcript_path = r'C:\Users\maiko\.gemini\antigravity-ide\brain\1eb355e9-b605-49e9-9c7a-ec2b0f79b8e4\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE':
            for tc in data.get('tool_calls', []):
                args = tc.get('args', {})
                if 'multi_replace_file_content' in str(tc):
                    if 'App.tsx' in str(args):
                        for chunk in eval(args.get('ReplacementChunks', '[]')):
                            print(chunk.get('TargetContent')[:500])
                            print("------------------------------------------")
