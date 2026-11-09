import React, { useState, useEffect } from 'react';
import { Book, Chapter, SectionType } from '../types/book';
import {
  X,
  BookMarked,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  Edit3,
  Eye,
  Mail,
  User,
  Shield,
  Heart,
  BookOpen,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ListOrdered,
  Layers,
} from 'lucide-react';

interface BackmatterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  chapters: Chapter[];
  onSaveChapters: (updatedChapters: Chapter[]) => Promise<void> | void;
  onSelectChapter: (chapterId: string) => void;
}

interface BackmatterPreset {
  id: string;
  name: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  generateContent: (book: Book) => string;
}

export const BackmatterManagerModal: React.FC<BackmatterManagerModalProps> = ({
  isOpen,
  onClose,
  book,
  chapters,
  onSaveChapters,
  onSelectChapter,
}) => {
  // Local working copy of backmatter chapters
  const [localBackmatter, setLocalBackmatter] = useState<Chapter[]>([]);
  const [selectedBackmatterId, setSelectedBackmatterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'presets' | 'preview'>('manage');
  const [customTitle, setCustomTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever modal opens or chapters change
  useEffect(() => {
    if (isOpen) {
      const bm = chapters
        .filter((c) => c.group === 'back-matter')
        .sort((a, b) => a.order - b.order);
      setLocalBackmatter(bm);
      if (bm.length > 0) {
        setSelectedBackmatterId(bm[0].id);
      } else {
        setSelectedBackmatterId(null);
        setActiveTab('presets');
      }
      setSaveSuccess(false);
    }
  }, [isOpen, chapters]);

  if (!isOpen) return null;

  const author = book.author || 'Author Name';
  const authorCleanSlug = author.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Pre-configured author presets
  const presets: BackmatterPreset[] = [
    {
      id: 'about-author',
      name: 'About the Author',
      type: 'about-author',
      title: 'About the Author',
      subtitle: 'Author Biography & Social Links',
      description: 'Polished biographical profile with photo placeholder, social links, and website info.',
      badge: 'Essential',
      icon: User,
      generateContent: (b) => {
        const a = b.author || 'Author Name';
        const slug = a.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `<div class="backmatter-about-author" style="text-align: center; max-width: 580px; margin: 0 auto; line-height: 1.65;">
  <div style="width: 100px; height: 100px; border-radius: 9999px; background: #e7e5e4; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; color: #78716c; border: 2px solid #d6d3d1;">
    ✍️
  </div>
  <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem; color: #292524;">${a}</h2>
  <p style="font-style: italic; color: #78716c; margin-bottom: 1.5rem;">Novelist & Storyteller</p>
  <p style="margin-bottom: 1.25rem; text-align: justify; text-indent: 1.5em;">${a} is the author of works exploring the hidden contours of human emotion and unforgettable worlds. When not crafting stories, they enjoy long walks through quiet landscapes, collecting vintage books, and brewing excessive amounts of coffee.</p>
  <p style="margin-bottom: 1.5rem; text-align: justify; text-indent: 1.5em;">Their stories have captivated readers worldwide. ${a} lives and writes from their home studio with a loyal reading companion by their side.</p>
  <div style="margin-top: 2rem; padding: 1.25rem; border: 1px solid #e7e5e4; border-radius: 12px; background: #fafaf9;">
    <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #44403c;">Connect with the Author:</p>
    <p style="font-size: 0.85rem; color: #78716c; margin: 0.25rem 0;">Website: <strong style="color: #b45309;">www.${slug}.com</strong></p>
    <p style="font-size: 0.85rem; color: #78716c; margin: 0.25rem 0;">Social Media: <strong>@${slug}</strong></p>
    <p style="font-size: 0.85rem; color: #78716c; margin: 0.25rem 0;">Inquiries: <strong>hello@${slug}.com</strong></p>
  </div>
</div>`;
      },
    },
    {
      id: 'copyright',
      name: 'Copyright Page',
      type: 'copyright',
      title: 'Copyright & Colophon',
      subtitle: 'Legal Rights, ISBN & Publisher Details',
      description: 'Standard publication rights, disclaimer of fiction, ISBN-13, and printing edition credits.',
      badge: 'Legal',
      icon: Shield,
      generateContent: (b) => {
        const a = b.author || 'Author Name';
        const currentYear = new Date().getFullYear();
        const publisher = b.publisher || 'FolioCraft Editions';
        const isbn = b.isbn || '978-1-987654-32-1';
        return `<div class="backmatter-copyright" style="max-width: 500px; margin: 0 auto; line-height: 1.6; font-size: 0.875rem; color: #44403c;">
  <p style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.25rem; color: #1c1917;">${b.title}</p>
  ${b.subtitle ? `<p style="font-style: italic; margin-bottom: 1rem; color: #78716c;">${b.subtitle}</p>` : ''}
  <div style="border-top: 1px solid #e7e5e4; margin: 1rem 0; width: 40px;"></div>
  <p style="margin-bottom: 0.75rem;">Copyright &copy; ${currentYear} by ${a}.<br />All rights reserved.</p>
  <p style="margin-bottom: 0.75rem;">Published by ${publisher}.</p>
  <p style="margin-bottom: 0.75rem;">No part of this publication may be reproduced, stored in a retrieval system, or transmitted in any form or by any means—electronic, mechanical, photocopying, recording, or otherwise—without prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews.</p>
  <p style="margin-bottom: 0.75rem;">This book is a work of fiction. Names, characters, places, and incidents either are the product of the author’s imagination or are used fictitiously. Any resemblance to actual persons, living or dead, events, or locales is entirely coincidental.</p>
  <p style="margin-bottom: 0.25rem;"><strong>ISBN (Print):</strong> ${isbn}</p>
  <p style="margin-bottom: 0.75rem;"><strong>ISBN (EPUB):</strong> 978-1-987654-33-8</p>
  <p style="margin-bottom: 0.75rem;"><strong>First Edition:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
  <p style="font-size: 0.75rem; color: #a8a29e; margin-top: 1.5rem;">Book design and typography produced with FolioCraft Studio.<br />Printed in the United States of America.</p>
</div>`;
      },
    },
    {
      id: 'newsletter',
      name: 'Newsletter Signup',
      type: 'newsletter',
      title: 'Join the VIP Readers Club',
      subtitle: 'Free Bonus Novella & Reader Magnet',
      description: 'Engaging call-to-action box offering free bonus material and reader mailing list signup.',
      badge: 'Marketing',
      icon: Mail,
      generateContent: (b) => {
        const a = b.author || 'Author Name';
        const slug = a.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `<div class="backmatter-newsletter" style="border: 2px dashed #f59e0b; border-radius: 16px; padding: 2.25rem 1.5rem; background: rgba(245, 158, 11, 0.04); text-align: center; max-width: 580px; margin: 1.5rem auto; line-height: 1.6;">
  <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">💌</div>
  <h2 style="font-size: 1.4rem; font-weight: bold; margin-bottom: 0.5rem; color: #b45309;">Never Miss the Next Adventure!</h2>
  <p style="font-size: 1rem; color: #44403c; margin-bottom: 1.25rem;">Join <strong>${a}’s VIP Readers Club</strong> and claim an exclusive bonus novella, deleted scenes, and first-look chapters from upcoming books.</p>
  <div style="display: inline-block; padding: 0.75rem 2rem; background: #d97706; color: #ffffff; font-weight: bold; font-size: 0.95rem; border-radius: 9999px; text-decoration: none; margin: 1rem 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    Claim Your Free Bonus Book &rarr;
  </div>
  <p style="font-size: 0.9rem; color: #78716c; margin-top: 1rem;">Direct Signup: <strong>www.${slug}.com/bonus</strong></p>
  <p style="font-size: 0.75rem; color: #a8a29e; margin-top: 0.5rem;">Your privacy is strictly honored. No spam, ever. Unsubscribe with one click anytime.</p>
</div>`;
      },
    },
    {
      id: 'acknowledgments',
      name: 'Acknowledgments',
      type: 'acknowledgments',
      title: 'Acknowledgments',
      subtitle: 'Gratitude to Editors, Betas & Family',
      description: 'Warm, gracious author tribute thanking editors, readers, loved ones, and supporters.',
      badge: 'Tribute',
      icon: Heart,
      generateContent: (b) => {
        return `<div class="backmatter-acknowledgments" style="max-width: 580px; margin: 0 auto; line-height: 1.7; color: #292524;">
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">Bringing a manuscript to life is never a solitary endeavor. While the initial words are penned in quiet solitude, it takes a dedicated village of sharp minds, generous hearts, and steadfast supporters to turn a rough draft into the finished book in your hands.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">First and foremost, endless gratitude to my developmental and copy editors, whose relentless pursuit of narrative clarity and precision helped transform this story into something far beyond my initial vision.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">To my extraordinary beta readers and early reviewers—thank you for your brutal honesty, infectious enthusiasm, and late-night messages catching plot holes and continuity slips before anyone else saw them.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">To my family and closest friends: thank you for tolerating my distracted stares during dinner, my obsessive talk of fictional characters, and for always believing in this dream even when the finish line seemed miles away.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">And finally, to you, the reader. Thank you for dedicating your precious hours to these pages and allowing my characters into your imagination. This book exists because of you.</p>
</div>`;
      },
    },
    {
      id: 'also-by',
      name: 'Also by the Author',
      type: 'also-by',
      title: `Also by ${author}`,
      subtitle: 'Series Reading Order & Catalog',
      description: 'Organized bookography list highlighting series titles, standalones, and upcoming releases.',
      badge: 'Catalog',
      icon: BookOpen,
      generateContent: (b) => {
        const a = b.author || 'Author Name';
        const slug = a.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `<div class="backmatter-also-by" style="max-width: 560px; margin: 0 auto; line-height: 1.65; color: #292524;">
  <p style="text-align: center; font-weight: 600; font-size: 1.1rem; margin-bottom: 1.5rem; color: #1c1917;">Discover more works by ${a}:</p>
  
  <div style="margin-bottom: 1.75rem; padding-bottom: 1rem; border-bottom: 1px solid #e7e5e4;">
    <h3 style="font-weight: bold; font-size: 1.05rem; color: #b45309; margin-bottom: 0.5rem;">The Horizon Chronicles</h3>
    <ul style="list-style: none; padding-left: 0; margin: 0;">
      <li style="margin-bottom: 0.4rem; padding-left: 1rem; position: relative;">• <strong>Book 1:</strong> The First Ember</li>
      <li style="margin-bottom: 0.4rem; padding-left: 1rem; position: relative;">• <strong>Book 2:</strong> Whispers of the Meridian</li>
      <li style="margin-bottom: 0.4rem; padding-left: 1rem; position: relative;">• <strong>Book 3:</strong> Crown of the Sunken Sea</li>
    </ul>
  </div>

  <div style="margin-bottom: 1.75rem;">
    <h3 style="font-weight: bold; font-size: 1.05rem; color: #b45309; margin-bottom: 0.5rem;">Standalone Novels</h3>
    <ul style="list-style: none; padding-left: 0; margin: 0;">
      <li style="margin-bottom: 0.4rem; padding-left: 1rem; position: relative;">• The Midnight Archivist</li>
      <li style="margin-bottom: 0.4rem; padding-left: 1rem; position: relative;">• Echoes in the Clocktower</li>
    </ul>
  </div>

  <p style="text-align: center; font-style: italic; color: #78716c; margin-top: 2rem; font-size: 0.9rem;">
    Visit <strong style="color: #d97706;">www.${slug}.com/books</strong> for chronological reading guides and discussion questions.
  </p>
</div>`;
      },
    },
    {
      id: 'review-request',
      name: 'Review Request / Note to Reader',
      type: 'review-request',
      title: 'A Note from the Author',
      subtitle: 'Kind Request for Amazon & Goodreads Reviews',
      description: 'Personal note thanking the reader for finishing the journey and encouraging an honest review.',
      badge: 'Community',
      icon: MessageSquare,
      generateContent: (b) => {
        const a = b.author || 'Author Name';
        return `<div class="backmatter-review-request" style="text-align: center; max-width: 540px; margin: 0 auto; line-height: 1.65; color: #292524;">
  <p style="font-style: italic; font-size: 1.15rem; margin-bottom: 1rem; color: #1c1917;">Dear Reader,</p>
  <p style="margin-bottom: 1.25rem;">Thank you so much for reading to the very end of ${b.title}. These characters and their journey mean the world to me, and sharing them with you has been a true honor.</p>
  <p style="margin-bottom: 1.25rem;">If you enjoyed this book, would you please consider taking a moment to leave a short, honest review on Amazon, Goodreads, or BookBub?</p>
  <p style="margin-bottom: 1.5rem; font-size: 0.95rem; color: #57534e;">For an author, reader reviews are everything. They help fellow readers discover the story, boost visibility in bookstores, and give me the support needed to continue writing the next book.</p>
  
  <div style="display: flex; justify-content: center; gap: 0.75rem; margin: 1.5rem 0; flex-wrap: wrap;">
    <div style="padding: 0.5rem 1rem; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #44403c;">⭐ Review on Amazon</div>
    <div style="padding: 0.5rem 1rem; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #44403c;">📚 Add to Goodreads</div>
    <div style="padding: 0.5rem 1rem; border: 1px solid #d6d3d1; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #44403c;">🔔 Follow on BookBub</div>
  </div>

  <p style="margin-top: 2rem; font-style: italic; color: #44403c;">With deepest gratitude,<br /><strong style="font-style: normal; font-size: 1.1rem; color: #1c1917;">${a}</strong></p>
</div>`;
      },
    },
    {
      id: 'afterword',
      name: 'Afterword / Historical Note',
      type: 'afterword',
      title: 'Afterword & Historical Notes',
      subtitle: 'Behind the Scenes & Research Insights',
      description: 'Author reflections on real-world inspirations, research facts, and narrative decisions.',
      badge: 'Context',
      icon: Sparkles,
      generateContent: (b) => {
        return `<div class="backmatter-afterword" style="max-width: 580px; margin: 0 auto; line-height: 1.7; color: #292524;">
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">Fiction often borrows from reality in ways both subtle and surprising. While this story was conceived as a narrative exploration, several elements were inspired by real historical records and curious archival documents.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">Certain historical liberties were taken to suit the pacing and dramatic momentum of the narrative. Readers intrigued by the historical period are warmly encouraged to consult the primary source materials cited in the bibliography.</p>
  <p style="margin-bottom: 1.25rem; text-indent: 1.5em;">May the questions raised in these pages linger with you long after the final chapter has closed.</p>
</div>`;
      },
    },
  ];

  // Helper to re-index all chapters consistently across the book
  const syncAndApplyChapters = (newBackmatter: Chapter[]) => {
    // 1. Separate non-backmatter chapters
    const frontMatter = chapters
      .filter((c) => c.group === 'front-matter')
      .sort((a, b) => a.order - b.order);
    const bodyChapters = chapters
      .filter((c) => c.group === 'body')
      .sort((a, b) => a.order - b.order);

    // 2. Re-assign sequential order numbers
    let currentOrder = 1;

    const indexedFront = frontMatter.map((ch) => ({
      ...ch,
      order: currentOrder++,
    }));

    const indexedBody = bodyChapters.map((ch) => ({
      ...ch,
      order: currentOrder++,
    }));

    const indexedBack = newBackmatter.map((ch) => ({
      ...ch,
      group: 'back-matter' as const,
      order: currentOrder++,
    }));

    const allReindexed = [...indexedFront, ...indexedBody, ...indexedBack];
    setLocalBackmatter(indexedBack);
    return allReindexed;
  };

  // Move a backmatter chapter up in sequence
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...localBackmatter];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Move a backmatter chapter down in sequence
  const handleMoveDown = (index: number) => {
    if (index >= localBackmatter.length - 1) return;
    const updated = [...localBackmatter];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Delete a backmatter section
  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from the backmatter?`)) {
      return;
    }
    const updated = localBackmatter.filter((c) => c.id !== id);
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    if (selectedBackmatterId === id) {
      setSelectedBackmatterId(updated[0]?.id || null);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Toggle Table of Contents inclusion
  const handleToggleToc = (id: string) => {
    const updated = localBackmatter.map((c) =>
      c.id === id ? { ...c, includeInToc: !c.includeInToc } : c
    );
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Update chapter title inline
  const handleUpdateTitle = (id: string, newTitle: string) => {
    const updated = localBackmatter.map((c) =>
      c.id === id ? { ...c, title: newTitle } : c
    );
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
  };

  // Add a preset template to the backmatter
  const handleAddPreset = (preset: BackmatterPreset) => {
    const content = preset.generateContent(book);
    const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    const newId = `bm_${preset.type}_${Date.now()}`;

    const newChapter: Chapter = {
      id: newId,
      bookId: book.id,
      title: preset.title,
      subtitle: preset.subtitle || '',
      type: preset.type,
      group: 'back-matter',
      content,
      order: 9999, // Will be reindexed cleanly
      wordCount: words,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    };

    const updated = [...localBackmatter, newChapter];
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    setSelectedBackmatterId(newId);
    setActiveTab('manage');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Add a blank custom backmatter section
  const handleAddCustom = () => {
    const title = customTitle.trim() || 'Custom Backmatter Section';
    const newId = `bm_custom_${Date.now()}`;
    const newChapter: Chapter = {
      id: newId,
      bookId: book.id,
      title,
      subtitle: '',
      type: 'afterword',
      group: 'back-matter',
      content: `<p>Start writing your backmatter section content here...</p>`,
      order: 9999,
      wordCount: 8,
      includeInToc: true,
      pageBreakBefore: true,
      footnotes: [],
    };

    const updated = [...localBackmatter, newChapter];
    const reindexed = syncAndApplyChapters(updated);
    onSaveChapters(reindexed);
    setSelectedBackmatterId(newId);
    setCustomTitle('');
    setActiveTab('manage');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Selected item for preview
  const selectedChapter = localBackmatter.find((c) => c.id === selectedBackmatterId) || localBackmatter[0];

  const totalBackmatterWords = localBackmatter.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl h-[94dvh] sm:h-[88vh] max-h-[760px] flex flex-col shadow-2xl overflow-hidden text-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif text-stone-100">Backmatter Manager</h2>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  Atticus & Vellum Standard
                </span>
                {saveSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Organize and order closing pages at the end of your manuscript ({localBackmatter.length} sections &bull; {totalBackmatterWords.toLocaleString()} words)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers for smaller screens */}
            <div className="flex items-center bg-stone-800/80 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  activeTab === 'manage'
                    ? 'bg-stone-700 text-stone-100 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Manuscript Order ({localBackmatter.length})
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Templates Library</span>
              </button>
              {localBackmatter.length > 0 && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all lg:hidden ${
                    activeTab === 'preview'
                      ? 'bg-stone-700 text-stone-100 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Views */}
          {activeTab === 'presets' ? (
            /* Presets Library View */
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Choose a Backmatter Template to Add</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('manage')}
                    className="text-xs text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>&larr; Return to manuscript order</span>
                  </button>
                </div>
                <p className="text-xs text-stone-400">
                  Pre-formatted with publishing industry layouts, legal disclaimers, and conversion-optimized callout boxes.
                </p>
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {presets.map((preset) => {
                  const Icon = preset.icon;
                  const alreadyExists = localBackmatter.some((c) => c.type === preset.type);
                  return (
                    <div
                      key={preset.id}
                      className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-stone-850 group-hover:bg-amber-500/20 text-stone-300 group-hover:text-amber-300 flex items-center justify-center transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                                {preset.name}
                              </h4>
                              <p className="text-[11px] text-stone-500 font-mono">{preset.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700/60">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-2 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-850 flex items-center justify-between">
                        {alreadyExists ? (
                          <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Included in manuscript</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500">Not added yet</span>
                        )}

                        <button
                          onClick={() => handleAddPreset(preset)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{alreadyExists ? 'Add Another' : 'Add to End'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Backmatter Card */}
              <div className="p-4 rounded-xl bg-stone-950/40 border border-dashed border-stone-800 hover:border-stone-700 transition-all">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Add Custom Backmatter Section</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g., Reader Discussion Questions, Glossary, Appendix..."
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustom();
                    }}
                  />
                  <button
                    onClick={handleAddCustom}
                    className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create Custom Section</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Manage Order & Preview Columns */
            <>
              {/* Left Column: Sequential Reorderable Backmatter Pages */}
              <div className="w-full lg:w-[48%] border-r border-stone-800 flex flex-col bg-stone-950/30 overflow-hidden">
                {/* List Header */}
                <div className="p-3 border-b border-stone-800/80 bg-stone-950/50 flex items-center justify-between text-xs font-semibold text-stone-400">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-amber-400" />
                    <span>Closing Sequence ({localBackmatter.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('presets')}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Preset Page</span>
                  </button>
                </div>

                {/* Backmatter List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {localBackmatter.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 space-y-3">
                      <BookMarked className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-stone-300">No Backmatter Pages Yet</p>
                        <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                          Backmatter pages like About the Author, Copyright, and Newsletter Signup are placed after your story to engage readers.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('presets')}
                        className="mt-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Browse Backmatter Templates &rarr;</span>
                      </button>
                    </div>
                  ) : (
                    localBackmatter.map((ch, idx) => {
                      const isSelected = selectedBackmatterId === ch.id;
                      const isFirst = idx === 0;
                      const isLast = idx === localBackmatter.length - 1;

                      return (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedBackmatterId(ch.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-stone-850/90 border-amber-500/70 shadow-md ring-1 ring-amber-500/30'
                              : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 hover:bg-stone-850/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Sequence Badge & Title */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="w-6 h-6 rounded-md bg-stone-800 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 border border-stone-700/60">
                                {idx + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <input
                                  type="text"
                                  value={ch.title}
                                  onChange={(e) => handleUpdateTitle(ch.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full bg-transparent text-xs font-semibold text-stone-100 hover:bg-stone-800/60 focus:bg-stone-950 focus:px-1.5 focus:py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500/60 truncate"
                                  title="Click to rename"
                                />
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono mt-0.5">
                                  <span className="capitalize">{ch.type.replace('-', ' ')}</span>
                                  <span>&bull;</span>
                                  <span>{ch.wordCount || 0} words</span>
                                </div>
                              </div>
                            </div>

                            {/* Reordering & Actions */}
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Move Up */}
                              <button
                                onClick={() => handleMoveUp(idx)}
                                disabled={isFirst}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isFirst
                                    ? 'border-stone-850 text-stone-600 opacity-40 cursor-not-allowed'
                                    : 'border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                                }`}
                                title="Move up in order"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                onClick={() => handleMoveDown(idx)}
                                disabled={isLast}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isLast
                                    ? 'border-stone-850 text-stone-600 opacity-40 cursor-not-allowed'
                                    : 'border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-800'
                                }`}
                                title="Move down in order"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(ch.id, ch.title)}
                                className="p-1.5 rounded-lg border border-stone-800 text-stone-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
                                title="Remove from manuscript"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Options Footer: TOC inclusion & Jump to Editor */}
                          <div
                            className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={ch.includeInToc}
                                onChange={() => handleToggleToc(ch.id)}
                                className="rounded bg-stone-800 border-stone-700 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                              />
                              <span>Include in Table of Contents</span>
                            </label>

                            <button
                              onClick={() => {
                                onSelectChapter(ch.id);
                                onClose();
                              }}
                              className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
                              title="Open chapter directly in the editor"
                            >
                              <span>Edit Content</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Quick Add */}
                <div className="p-3 border-t border-stone-800/80 bg-stone-950/60 flex items-center justify-between text-xs">
                  <span className="text-stone-500 text-[11px]">
                    Drag or use arrows to change ending sequence
                  </span>
                  <button
                    onClick={() => setActiveTab('presets')}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add New Page</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Editorial Preview */}
              <div className="hidden lg:flex flex-1 flex-col bg-stone-900/60 overflow-hidden">
                {selectedChapter ? (
                  <>
                    <div className="p-3.5 border-b border-stone-800/80 bg-stone-950/50 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-400" />
                        <div>
                          <h3 className="text-xs font-bold text-stone-200 truncate">
                            {selectedChapter.title}
                          </h3>
                          <span className="text-[10px] text-stone-500 font-mono">
                            Editorial Layout Preview &bull; {selectedChapter.wordCount || 0} words
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectChapter(selectedChapter.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Open in Editor &rarr;</span>
                      </button>
                    </div>

                    {/* Book Page Paper Canvas Preview */}
                    <div className="flex-1 overflow-y-auto p-6 bg-stone-950/80 flex justify-center">
                      <div className="bg-[#fcfbf9] text-[#1c1917] p-8 md:p-12 rounded-xl shadow-xl border border-stone-300 w-full max-w-[540px] min-h-[460px] my-auto flex flex-col justify-start">
                        <div className="text-center mb-6">
                          <h1 className="font-serif text-xl font-bold tracking-tight text-stone-900 mb-1">
                            {selectedChapter.title}
                          </h1>
                          {selectedChapter.subtitle && (
                            <p className="font-serif italic text-xs text-stone-500">
                              {selectedChapter.subtitle}
                            </p>
                          )}
                          <div className="w-12 h-px bg-amber-600/40 mx-auto mt-3"></div>
                        </div>

                        <div
                          className="font-serif text-[13px] leading-relaxed prose prose-stone max-w-none text-stone-800"
                          dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-500 text-center">
                    <Layers className="w-12 h-12 mb-3 opacity-20 text-stone-400" />
                    <p className="text-sm font-medium text-stone-400">Select a Backmatter Page</p>
                    <p className="text-xs text-stone-600 mt-1 max-w-xs">
                      Click any item on the left to inspect its formatted book page preview.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile Preview View */}
          {activeTab === 'preview' && selectedChapter && (
            <div className="flex-1 flex flex-col bg-stone-950 p-4 overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setActiveTab('manage')}
                  className="text-xs text-amber-400 hover:underline"
                >
                  &larr; Back to Order
                </button>
                <button
                  onClick={() => {
                    onSelectChapter(selectedChapter.id);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs"
                >
                  Open in Editor
                </button>
              </div>

              <div className="bg-[#fcfbf9] text-[#1c1917] p-6 rounded-xl shadow border border-stone-300">
                <h1 className="font-serif text-lg font-bold text-center mb-4">
                  {selectedChapter.title}
                </h1>
                <div
                  className="font-serif text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedChapter.content }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/90 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-stone-400 text-[11px]">
            <BookMarked className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Backmatter appears at the end of PDF, EPUB, and Kindle exports.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
