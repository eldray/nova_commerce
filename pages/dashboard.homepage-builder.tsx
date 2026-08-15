import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './dashboard.homepage-builder.module.css';

interface Section {
  id: number;
  sectionType: string;
  title: string;
  subtitle: string;
  sortOrder: number;
  isEnabled: boolean;
  isPublished: boolean;
  backgroundColor?: string;
  textColor?: string;
  items?: any[];
}

interface Template {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  isPopular: boolean;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: '🎯 Hero Banner',
  banner: '📢 Promotional Banner',
  featured_products: '⭐ Featured Products',
  categories: '📂 Categories',
  best_sellers: '🔥 Best Sellers',
  new_arrivals: '✨ New Arrivals',
  product_carousel: '🎠 Product Carousel',
  promotional: '🏷️ Promotional Section',
  image_text: '🖼️ Image & Text',
  testimonials: '💬 Testimonials',
  newsletter: '📧 Newsletter Signup',
  call_to_action: '📣 Call to Action',
  custom_html: '💻 Custom HTML',
};

export const DashboardHomepageBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Fetch sections and templates
  const { data: homepageData, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: async () => {
      const response = await fetch('/api/homepage');
      if (!response.ok) throw new Error('Failed to fetch homepage data');
      return response.json();
    },
  });

  // Add section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (sectionType: string) => {
      const response = await fetch('/api/homepage/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType }),
      });
      if (!response.ok) throw new Error('Failed to add section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
    },
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async (templateSlug: string) => {
      const response = await fetch('/api/homepage/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateSlug }),
      });
      if (!response.ok) throw new Error('Failed to apply template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
      setShowTemplates(false);
      setSelectedTemplate(null);
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      const response = await fetch('/api/homepage/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (!response.ok) throw new Error('Failed to delete section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
    },
  });

  // Toggle section enabled/disabled
  const toggleSectionMutation = useMutation({
    mutationFn: async ({ sectionId, isEnabled }: { sectionId: number; isEnabled: boolean }) => {
      const response = await fetch(`/api/homepage/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      if (!response.ok) throw new Error('Failed to update section');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage'] });
    },
  });

  const handleAddSection = (sectionType: string) => {
    if (confirm(`Add ${SECTION_TYPE_LABELS[sectionType]} section?`)) {
      addSectionMutation.mutate(sectionType);
    }
  };

  const handleDeleteSection = (sectionId: number) => {
    if (confirm('Are you sure you want to delete this section?')) {
      deleteSectionMutation.mutate(sectionId);
    }
  };

  const handleApplyTemplate = (templateSlug: string) => {
    if (confirm('Applying a template will replace your current homepage layout. Continue?')) {
      applyTemplateMutation.mutate(templateSlug);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading homepage builder...</p>
        </div>
      </div>
    );
  }

  const sections = homepageData?.sections || [];
  const templates = homepageData?.templates || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Homepage Builder</h1>
          <p>Customize your store's homepage without coding. Add, remove, and reorder sections.</p>
        </div>
        <button 
          className={styles.btnPrimary}
          onClick={() => setShowTemplates(!showTemplates)}
        >
          📋 Choose Template
        </button>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Select a Homepage Template</h2>
              <button className={styles.closeBtn} onClick={() => setShowTemplates(false)}>×</button>
            </div>
            <div className={styles.templatesGrid}>
              {templates.map((template: Template) => (
                <div key={template.id} className={styles.templateCard}>
                  {template.isPopular && (
                    <span className={styles.popularBadge}>Popular</span>
                  )}
                  <h3>{template.name}</h3>
                  <p className={styles.templateCategory}>{template.category}</p>
                  <p className={styles.templateDescription}>{template.description}</p>
                  <button
                    className={styles.selectTemplateBtn}
                    onClick={() => handleApplyTemplate(template.slug)}
                  >
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Sections */}
      <div className={styles.sectionsContainer}>
        <h2>Your Homepage Sections</h2>
        
        {sections.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No sections yet. Get started by adding sections or applying a template!</p>
          </div>
        ) : (
          <div className={styles.sectionsList}>
            {sections.map((section: Section, index: number) => (
              <div 
                key={section.id} 
                className={`${styles.sectionCard} ${!section.isEnabled ? styles.disabled : ''}`}
              >
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionInfo}>
                    <span className={styles.dragHandle}>☰</span>
                    <strong>{SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}</strong>
                    {section.title && <span className={styles.sectionTitle}> - {section.title}</span>}
                  </div>
                  <div className={styles.sectionActions}>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={section.isEnabled}
                        onChange={() => toggleSectionMutation.mutate({ 
                          sectionId: section.id, 
                          isEnabled: !section.isEnabled 
                        })}
                      />
                      <span className={styles.toggleText}>{section.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteSection(section.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                {section.subtitle && (
                  <p className={styles.sectionSubtitle}>{section.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Section Panel */}
      <div className={styles.addSectionPanel}>
        <h2>Add New Section</h2>
        <div className={styles.sectionTypesGrid}>
          {Object.entries(SECTION_TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              className={styles.sectionTypeBtn}
              onClick={() => handleAddSection(type)}
              disabled={addSectionMutation.isPending}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.previewNotice}>
        <p>💡 Tip: Preview your homepage anytime by visiting your store URL. Changes are saved automatically.</p>
      </div>
    </div>
  );
};
