import re
import os

views_dir = '/Users/kritikaacharya/HeritEgde/app/views'
partials_dir = os.path.join(views_dir, 'partials')

def process_file(file_name):
    path = os.path.join(views_dir, file_name)
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where <main> or the main content container starts
    main_start = content.find('<main')
    if main_start == -1:
        # try to find the container after header
        main_start = content.find('<!-- Left Section') # for auth page
        if main_start == -1: return

    # We want to replace everything before main_start with out includes
    prefix = """<!DOCTYPE html>
<html class="dark" lang="en">
<head>
    <%- include('partials/head') %>
</head>
<body class="bg-background-light dark:bg-background-dark text-white">
<div class="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
    <%- include('partials/header') %>
"""
    
    # Check if footer exists and replace it, or just append includes
    # But wait, footer structure varies. Let's just create a generic footer?
    # No, keep individual footers, but we want to strip the original closing tags
    
    body_end = content.find('</body>')
    html_end = content.find('</html>')
    
    if body_end != -1:
        new_content = prefix + content[main_start:body_end] + "</body></html>"
    else:
        new_content = prefix + content[main_start:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

process_file('index.ejs')
process_file('auth.ejs')
process_file('dashboard.ejs')
process_file('events.ejs')

