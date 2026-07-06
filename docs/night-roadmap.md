# SHANTARAM Studio Night Roadmap

## Priority pool

1. Cabinet library
   - Create, edit, delete cabinets.
   - Store cabinet library in Supabase.
   - Attach files to cabinet records.
   - Link screen configuration files to cabinets.

2. Cloud projects
   - Move project source of truth from localStorage to Supabase.
   - Keep localStorage only as temporary offline fallback.

3. Export
   - PDF export.
   - PNG export.
   - Export options: choose which information to include.

4. Branding
   - Upload logo for cabinet map.
   - Store logo in cloud storage.
   - Use logo in exported maps and documentation.

5. Cabinet map appearance
   - Cabinet color palette selection.
   - Configurable text/data displayed on each cabinet.

6. Screen files and references
   - Save screen configuration files.
   - Attach PDF, PNG, JPG screen references, including Capture screenshots.

7. Resolume export
   - Export screen map/layout for Resolume.

8. User account
   - Full registration page.
   - Terms and user agreement acceptance.

9. Developer contact
   - Contact page/section for developer support.

## Implementation order

### Phase A: Data foundation
- Add Supabase schema for projects, cabinet library, cabinet files, project files, app branding, user profiles.
- Add TypeScript domain models.
- Add cloud-storage service helpers.

### Phase B: Cabinet library UI
- Library page/panel.
- Create/edit/delete cabinet.
- Upload and attach config files.

### Phase C: Cloud-first projects
- Supabase project load/save as source of truth.
- Local fallback status indicator.

### Phase D: Export system
- Export settings modal.
- PNG renderer.
- PDF renderer.
- Resolume layout export.

### Phase E: Account and support
- Registration screen.
- Agreement checkbox.
- Contact developer block.
