# Character asset execution

Run the following in PowerShell from the repository root. It is deliberately two-stage: `character-anchor-prompt.jsonl` is the one non-final generation job, while every row in `character-prompts.jsonl` is an image edit that must receive the generated anchor. The five faction jobs use `emblem-*` IDs and filenames; the supplemental relic keeps its `relic-*` name.

The JSONL `out` and `final_out` fields are **basenames only**. Final chroma sources and alpha PNGs use the authoritative production directory, `apps/web/src/assets/bixin/uizip-generated`; the non-final anchor uses the separate temporary directory `tmp/imagegen/uizip-character-anchor`. Paths are therefore unambiguous regardless of the current directory.

```powershell
$skill = 'C:/Users/Administrator/.codex/skills/.system/imagegen'
$cli = Join-Path $skill 'scripts/image_gen.py'
$remove = Join-Path $skill 'scripts/remove_chroma_key.py'
$package = 'docs/redesign/image2-assets'
$outDir = 'apps/web/src/assets/bixin/uizip-generated'
$anchorDir = 'tmp/imagegen/uizip-character-anchor'
$anchorManifest = Join-Path $package 'character-anchor-prompt.jsonl'
$editManifest = Join-Path $package 'character-prompts.jsonl'

if (-not (Test-Path -LiteralPath $cli -PathType Leaf)) { throw "Missing image CLI: $cli" }
if (-not (Test-Path -LiteralPath $remove -PathType Leaf)) { throw "Missing chroma-key CLI: $remove" }
if (-not (Test-Path -LiteralPath $anchorManifest -PathType Leaf)) { throw "Missing anchor manifest: $anchorManifest" }
if (-not (Test-Path -LiteralPath $editManifest -PathType Leaf)) { throw "Missing edit manifest: $editManifest" }

$anchorJob = Get-Content -Raw $anchorManifest | ConvertFrom-Json
$jobs = @(Get-Content $editManifest | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json })
if ($anchorJob.final -ne $false -or $anchorJob.operation -ne 'generate' -or $anchorJob.model -ne 'gpt-image-2' -or $anchorJob.quality -ne 'high') { throw 'Anchor manifest is not a non-final high-quality gpt-image-2 generate job.' }
if ($jobs.Count -ne 20) { throw "Expected 20 edit jobs; found $($jobs.Count)." }
if ($jobs | Where-Object { $_.operation -ne 'edit' -or $_.image -ne 'character-style-anchor.png' -or $_.model -ne 'gpt-image-2' -or $_.quality -ne 'high' }) { throw 'Every final job must be a high-quality gpt-image-2 edit using character-style-anchor.png.' }
if ($anchorJob.out -match '[\\/]' -or $anchorJob.out -ne 'character-style-anchor.png') { throw 'Anchor out must be the expected basename only.' }
if ($jobs | Where-Object { $_.out -match '[\\/]' -or $_.final_out -match '[\\/]' -or $_.out -notmatch '-chroma\.png$' -or $_.final_out -match '-chroma\.png$' }) { throw 'out/final_out must be chroma/final basenames only.' }

$anchor = Join-Path $anchorDir $anchorJob.out
$productionTargets = @($jobs | ForEach-Object { Join-Path $outDir $_.out }) + @($jobs | ForEach-Object { Join-Path $outDir $_.final_out })
$targets = @($anchor) + $productionTargets
$duplicates = $targets | Group-Object | Where-Object Count -gt 1
if ($duplicates) { throw "Output-name collision: $($duplicates.Name -join ', ')" }
$collisions = $targets | Where-Object { Test-Path -LiteralPath $_ }
if ($collisions) { throw "Refusing to overwrite existing output(s): $($collisions -join ', ')" }
New-Item -ItemType Directory -Path $anchorDir -Force -ErrorAction Stop | Out-Null
New-Item -ItemType Directory -Path $outDir -Force -ErrorAction Stop | Out-Null
```

Only after that preflight passes, generate the anchor. `--no-augment` keeps the manifest prompt literal; the command below is safe to inspect first by appending `--dry-run`.

```powershell
python $cli generate-batch --input $anchorManifest --out-dir $anchorDir --model gpt-image-2 --quality high --output-format png --no-augment
if (-not (Test-Path -LiteralPath $anchor -PathType Leaf)) { throw "Anchor generation did not create $anchor" }
```

Do **not** pass `character-prompts.jsonl` to `generate-batch`: that command calls the generations endpoint and ignores image inputs. Instead, run each entry as an edit, using the anchor image. Do not add `--input-fidelity` or `--force`.

```powershell
foreach ($job in $jobs) {
  python $cli edit --model $job.model --quality $job.quality --size $job.size --output-format png --image $anchor --prompt $job.prompt --out (Join-Path $outDir $job.out) --no-augment
  if ($LASTEXITCODE -ne 0) { throw "Edit failed: $($job.id)" }
}
```

Finally, convert every opaque chroma source to its paired alpha PNG with the supplied chroma-key tool. It keys exactly the manifest's per-job `key_color`, retains a soft matte, cleans color spill, and writes only to `final_out`.

```powershell
foreach ($job in $jobs) {
  $source = Join-Path $outDir $job.out
  $destination = Join-Path $outDir $job.final_out
  python $remove --input $source --out $destination --key-color $job.key_color --tolerance 28 --soft-matte --transparent-threshold 16 --opaque-threshold 72 --edge-feather 1 --edge-contract 1 --spill-cleanup
  if ($LASTEXITCODE -ne 0) { throw "Chroma-key removal failed: $($job.id)" }
  if (-not (Test-Path -LiteralPath $destination -PathType Leaf)) { throw "Chroma-key removal did not create $destination" }
}
```

No image output belongs in the prompt package. The non-final anchor is written only to `tmp/imagegen/uizip-character-anchor`; production chroma sources and final alpha PNGs are written only to `apps/web/src/assets/bixin/uizip-generated`, each by an explicitly run command.
