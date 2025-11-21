#!/bin/bash
# Exit on errors
set -e

BASE_DIR=$(pwd)

cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Playwright & Allure Reports</title>
<style>
  body { font-family: Arial, sans-serif; padding: 2rem; background: #f7f7f7; }
  h1 { color: #2c3e50; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { padding: 0.75rem; border: 1px solid #ddd; text-align: left; }
  th { background-color: #2c3e50; color: #fff; }
  tr.main-branch { background-color: #dff0d8; font-weight: bold; }
  a { text-decoration: none; color: #3498db; }
  a:hover { text-decoration: underline; }
  .badge { display: inline-block; padding: 2px 6px; font-size: 0.8em; border-radius: 4px; color: #fff; margin-left: 5px; }
  .badge-main { background-color: #27ae60; }
  .badge-latest { background-color: #e67e22; }
  img.screenshot { height:50px; border:1px solid #ddd; }
</style>
</head>
<body>
<h1>Playwright & Allure Reports</h1>
<table>
<thead>
<tr>
  <th>Branch</th>
  <th>Allure Report</th>
  <th>Playwright HTML Report</th>
  <th>Last Updated</th>
  <th>Screenshots</th>
  <th>Traces</th>
</tr>
</thead>
<tbody>
EOF

# --- Get branches with reports ---
branches=$(ls -1d allure-reports/* playwright-reports/* 2>/dev/null | xargs -n1 basename | sort -u)
declare -A branch_times

for branch in $branches; do
  allure_dir="allure-reports/$branch"
  playwright_dir="playwright-reports/$branch"

  allure_time=$(stat -c %Y "$allure_dir" 2>/dev/null || echo 0)
  playwright_time=$(stat -c %Y "$playwright_dir" 2>/dev/null || echo 0)
  latest_time=$(( allure_time > playwright_time ? allure_time : playwright_time ))
  branch_times[$branch]=$latest_time
done

main_branch="master"
latest_branch=$(for b in "${!branch_times[@]}"; do echo "$b ${branch_times[$b]}"; done | sort -k2 -nr | head -n 1 | awk '{print $1}')

# --- Generate table rows ---
for branch in $(for b in "${!branch_times[@]}"; do echo "$b ${branch_times[$b]}"; done | sort -k2 -nr | awk '{print $1}'); do
  row_class=""
  badges=""
  [[ "$branch" == "$main_branch" ]] && row_class="main-branch" && badges="$badges <span class='badge badge-main'>MASTER</span>"
  [[ "$branch" == "$latest_branch" ]] && badges="$badges <span class='badge badge-latest'>LATEST</span>"
  last_updated=$(date -d @"${branch_times[$branch]}" '+%Y-%m-%d %H:%M:%S')

  allure_link="allure-reports/$branch"
  playwright_link="playwright-reports/$branch"
  [[ ! -d "$allure_link" ]] && allure_link="#"
  [[ ! -d "$playwright_link" ]] && playwright_link="#"

  screenshot_file=$(ls -1 "$playwright_link/screenshots" 2>/dev/null | head -n1)
  trace_file=$(ls -1 "$playwright_link/traces" 2>/dev/null | head -n1)
  screenshot_html=""
  trace_html=""
  [[ -n "$screenshot_file" ]] && screenshot_html="<a href='$playwright_link/screenshots/$screenshot_file' target='_blank'><img src='$playwright_link/screenshots/$screenshot_file' class='screenshot'></a>"
  [[ -n "$trace_file" ]] && trace_html="<a href='$playwright_link/traces/$trace_file' target='_blank'>Trace</a>"

  echo "<tr class='$row_class'>
          <td>$branch $badges</td>
          <td><a href='$allure_link' target='_blank'>Allure</a></td>
          <td><a href='$playwright_link' target='_blank'>Playwright</a></td>
          <td>$last_updated</td>
          <td>$screenshot_html</td>
          <td>$trace_html</td>
        </tr>" >> index.html
done

echo "</tbody></table></body></html>" >> index.html
