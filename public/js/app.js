async function api(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers,
    body,
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed (${response.status})`);
    error.code = data.error;
    error.status = response.status;
    throw error;
  }
  return data;
}

function notifyToast(message) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  region.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

function showFormError(form, message) {
  const box = form.querySelector('[data-error]');
  if (!box) {
    notifyToast(message);
    return;
  }
  box.textContent = message;
  box.hidden = !message;
}

async function uploadPublicFile(file) {
  if (!file || !file.size) return '';
  const formData = new FormData();
  formData.append('file', file);
  const uploaded = await api('/api/uploads/public', { method: 'POST', body: formData });
  return uploaded.file_url || '';
}

const formHandlers = {
  async login(form) {
    const fd = new FormData(form);
    await api('/api/auth/login', {
      method: 'POST',
      body: { email: fd.get('email'), password: fd.get('password') },
    });
    window.location.href = form.dataset.next || '/';
  },

  async register(form) {
    const fd = new FormData(form);
    await api('/api/auth/register', {
      method: 'POST',
      body: {
        displayName: fd.get('displayName'),
        email: fd.get('email'),
        password: fd.get('password'),
      },
    });
    window.location.href = form.dataset.next || '/';
  },

  async 'create-album'(form) {
    const fd = new FormData(form);
    const coverUrl = await uploadPublicFile(fd.get('cover_file'));
    const created = await api('/api/entities/Album', {
      method: 'POST',
      body: {
        title: String(fd.get('title') || '').trim(),
        artist: String(fd.get('artist') || '').trim(),
        genre: String(fd.get('genre') || 'rock'),
        type: String(fd.get('type') || 'album'),
        release_year: fd.get('release_year') ? Number(fd.get('release_year')) : undefined,
        description: String(fd.get('description') || '').trim(),
        cover_url: coverUrl,
      },
    });
    window.location.href = `/album/${encodeURIComponent(created.id)}`;
  },

  async 'create-review'(form) {
    const fd = new FormData(form);
    const albumId = String(fd.get('album_id') || '');
    await api('/api/entities/Review', {
      method: 'POST',
      body: {
        kind: 'album_review',
        album_id: albumId,
        album_title: fd.get('album_title'),
        album_artist: fd.get('album_artist'),
        album_cover_url: fd.get('album_cover_url'),
        genre: fd.get('genre'),
        title: String(fd.get('title') || '').trim(),
        rating: Number(fd.get('rating') || 5),
        content: String(fd.get('content') || '').trim(),
      },
    });
    if (albumId) {
      await api('/api/functions/editReview', {
        method: 'POST',
        body: { action: 'syncRating', album_id: albumId },
      });
    }
    window.location.reload();
  },

  async 'create-story'(form) {
    const fd = new FormData(form);
    await api('/api/entities/Review', {
      method: 'POST',
      body: {
        kind: String(fd.get('kind') || 'story'),
        genre: String(fd.get('genre') || '') || undefined,
        title: String(fd.get('title') || '').trim(),
        content: String(fd.get('content') || '').trim(),
      },
    });
    window.location.reload();
  },

  async 'edit-review'(form) {
    const fd = new FormData(form);
    await api('/api/functions/editReview', {
      method: 'POST',
      body: {
        id: form.dataset.id,
        expected_edit: form.dataset.expectedEdit || null,
        changes: {
          title: String(fd.get('title') || '').trim(),
          rating: Number(fd.get('rating') || 5),
          content: String(fd.get('content') || '').trim(),
        },
      },
    });
    window.location.reload();
  },

  async 'create-comment'(form) {
    const fd = new FormData(form);
    await api('/api/entities/Comment', {
      method: 'POST',
      body: {
        review_id: fd.get('review_id'),
        content: String(fd.get('content') || '').trim(),
      },
    });
    window.location.reload();
  },

  async 'update-profile'(form) {
    const fd = new FormData(form);
    const displayName = String(fd.get('display_name') || '').trim();
    const prefs = fd.getAll('music_preferences').map(String);
    await api('/api/auth/me', {
      method: 'PATCH',
      body: {
        display_name: displayName,
        full_name: displayName,
        bio: String(fd.get('bio') || '').trim(),
        music_preferences: prefs,
      },
    });
    await api('/api/functions/propagateProfile', { method: 'POST', body: {} });
    notifyToast('Profile saved');
    window.location.reload();
  },

  async 'upload-avatar'(form) {
    const fd = new FormData(form);
    const fileUrl = await uploadPublicFile(fd.get('file'));
    if (!fileUrl) throw new Error('Select an image file first');
    await api('/api/auth/me', {
      method: 'PATCH',
      body: { profile_picture_url: fileUrl },
    });
    window.location.reload();
  },

  async 'search-users'(form) {
    const fd = new FormData(form);
    const data = await api('/api/functions/searchUsers', {
      method: 'POST',
      body: { query: String(fd.get('query') || '') },
    });
    const list = document.querySelector('[data-search-results]');
    if (!list) return;
    list.innerHTML = '';
    for (const item of data.results || []) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-xs';
      btn.textContent = item.full_name;
      btn.addEventListener('click', async () => {
        const profile = await api('/api/functions/publicProfile', {
          method: 'POST',
          body: { user_id: item.id },
        });
        if (profile.found && profile.email) {
          window.location.href = `/chat?peer=${encodeURIComponent(profile.email)}`;
        }
      });
      li.appendChild(btn);
      list.appendChild(li);
    }
    if (!(data.results || []).length) {
      const li = document.createElement('li');
      li.className = 'muted text-xs';
      li.textContent = 'No matching members.';
      list.appendChild(li);
    }
  },

  async 'send-chat'(form) {
    const fd = new FormData(form);
    const file = fd.get('attachment_file');
    let attachmentUrl = '';
    let attachmentName = '';
    let attachmentKind = '';
    if (file && file.size) {
      attachmentUrl = await uploadPublicFile(file);
      attachmentName = file.name;
      attachmentKind = file.type?.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file';
    }
    await api('/api/functions/sendChatMessage', {
      method: 'POST',
      body: {
        peer_email: fd.get('peer_email'),
        content: String(fd.get('content') || '').trim(),
        attachment_url: attachmentUrl || undefined,
        attachment_name: attachmentName || undefined,
        attachment_kind: attachmentKind || undefined,
      },
    });
    window.location.reload();
  },

  async 'publish-recruit'(form) {
    const fd = new FormData(form);
    let posterAssetId;
    const posterFile = fd.get('poster_file');
    if (posterFile && posterFile.size) {
      const posterForm = new FormData();
      posterForm.append('file', posterFile);
      const uploaded = await api('/api/functions/uploadRecruitPoster', {
        method: 'POST',
        body: posterForm,
      });
      posterAssetId = uploaded.asset_id;
    }
    await api('/api/functions/publishRecruitPost', {
      method: 'POST',
      body: {
        agreed: fd.get('agreed') === 'true',
        draft: {
          kind: fd.get('kind'),
          city: String(fd.get('city') || '').trim(),
          school: String(fd.get('school') || '').trim(),
          title: String(fd.get('title') || '').trim(),
          influences: String(fd.get('influences') || '').trim(),
          description: String(fd.get('description') || '').trim(),
          poster_asset_id: posterAssetId,
        },
      },
    });
    window.location.reload();
  },

  async 'publish-podcast'(form) {
    const fd = new FormData(form);
    const audioFile = fd.get('audio_file');
    if (!audioFile || !audioFile.size) throw new Error('Audio file is required');
    const started = await api('/api/functions/podcastUpload', {
      method: 'POST',
      body: {
        action: 'start',
        file_name: audioFile.name,
        size_bytes: audioFile.size,
        content_type: audioFile.type || 'audio/mpeg',
      },
    });
    const partSize = started.part_size || 16 * 1024 * 1024;
    for (let partNumber = 1; partNumber <= started.part_count; partNumber += 1) {
      const start = (partNumber - 1) * partSize;
      const chunk = audioFile.slice(start, start + partSize);
      const partForm = new FormData();
      partForm.append('action', 'proxy');
      partForm.append('session_id', started.session_id);
      partForm.append('part_number', String(partNumber));
      partForm.append('file', chunk, audioFile.name);
      await api('/api/functions/podcastUpload', { method: 'POST', body: partForm });
    }
    await api('/api/functions/podcastUpload', {
      method: 'POST',
      body: { action: 'complete', session_id: started.session_id },
    });
    const publishForm = new FormData();
    publishForm.append('upload_session_id', started.session_id);
    publishForm.append('title', String(fd.get('title') || '').trim());
    publishForm.append('host_name', String(fd.get('host_name') || '').trim());
    publishForm.append('category', String(fd.get('category') || ''));
    publishForm.append('description', String(fd.get('description') || '').trim());
    publishForm.append('duration_minutes', String(fd.get('duration_minutes') || '0'));
    const coverFile = fd.get('cover_file');
    if (coverFile && coverFile.size) publishForm.append('cover_file', coverFile);
    await api('/api/functions/publishPodcast', { method: 'POST', body: publishForm });
    window.location.reload();
  },
};

const actionHandlers = {
  async logout() {
    await api('/api/auth/logout', { method: 'POST', body: {} });
    window.location.href = '/';
  },

  async vote(button) {
    const result = await api('/api/functions/voteReview', {
      method: 'POST',
      body: { review_id: button.dataset.reviewId, vote: button.dataset.vote },
    });
    const card = button.closest('[data-review-id]');
    if (card) {
      const likes = card.querySelector('[data-like-count]');
      const dislikes = card.querySelector('[data-dislike-count]');
      if (likes) likes.textContent = String(result.likes_count ?? 0);
      if (dislikes) dislikes.textContent = String(result.dislikes_count ?? 0);
    }
  },

  async translate(button) {
    const card = button.closest('article');
    const target = card?.querySelector('[data-translatable]');
    if (!target) return;
    if (target.dataset.original) {
      target.textContent = target.dataset.original;
      delete target.dataset.original;
      return;
    }
    const original = target.textContent || '';
    const res = await api('/api/functions/translateText', {
      method: 'POST',
      body: { text: original, target: button.dataset.targetLang || document.body.dataset.lang || 'en' },
    });
    target.dataset.original = original;
    target.textContent = res.translated || original;
  },

  async 'delete-entity'(button) {
    await api(`/api/entities/${encodeURIComponent(button.dataset.entity)}/${encodeURIComponent(button.dataset.id)}`, {
      method: 'DELETE',
    });
    window.location.reload();
  },

  async 'toggle-badge'(button) {
    const current = (button.dataset.equipped || '').split(',').filter(Boolean);
    const id = button.dataset.badgeId;
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id].slice(0, 4);
    await api('/api/auth/me', { method: 'PATCH', body: { equipped_badges: next } });
    window.location.reload();
  },

  async 'toggle-follow'(button) {
    const subId = button.dataset.subId;
    if (subId) {
      await api(`/api/entities/Subscription/${encodeURIComponent(subId)}`, { method: 'DELETE' });
    } else {
      await api('/api/entities/Subscription', {
        method: 'POST',
        body: {
          target_email: button.dataset.targetEmail,
          target_name: button.dataset.targetName,
        },
      });
    }
    window.location.reload();
  },

  async 'send-friend-request'(button) {
    await api('/api/functions/friendRequests', {
      method: 'POST',
      body: { action: 'send', target_id: button.dataset.targetId },
    });
    notifyToast('Friend request sent');
  },

  async 'respond-friend'(button) {
    await api('/api/functions/friendRequests', {
      method: 'POST',
      body: { action: 'respond', id: button.dataset.id, status: button.dataset.status },
    });
    window.location.reload();
  },

  async 'load-podcast-audio'(button) {
    const id = button.dataset.podcastId;
    const res = await api('/api/functions/getPodcastAudio', {
      method: 'POST',
      body: { podcast_id: id },
    });
    const slot = document.querySelector(`[data-audio-slot="${id}"]`);
    if (!slot || !res.signed_url) return;
    slot.innerHTML = '';
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = res.signed_url;
    slot.appendChild(audio);
  },

  async 'load-poster'(button) {
    const id = button.dataset.postId;
    const res = await api('/api/functions/getRecruitPoster', {
      method: 'POST',
      body: { post_id: id },
    });
    const slot = document.querySelector(`[data-poster-slot="${id}"]`);
    if (!slot || !res.signed_url) return;
    slot.innerHTML = '';
    const img = document.createElement('img');
    img.src = res.signed_url;
    img.alt = 'Recruitment poster';
    img.style.marginTop = '0.75rem';
    img.style.borderRadius = '8px';
    slot.appendChild(img);
  },

  async 'report-post'(button) {
    await api('/api/entities/Report', {
      method: 'POST',
      body: {
        target_type: 'RecruitPost',
        target_id: button.dataset.id,
        reason: `Reported recruitment post: ${button.dataset.title || ''}`,
      },
    });
    notifyToast('Report submitted');
  },

  async 'moderate-review'(button) {
    await api('/api/functions/editReview', {
      method: 'POST',
      body: { action: 'moderate', id: button.dataset.id, status: button.dataset.status },
    });
    window.location.reload();
  },

  async 'moderate-entity'(button) {
    await api(`/api/entities/${encodeURIComponent(button.dataset.entity)}/${encodeURIComponent(button.dataset.id)}`, {
      method: 'PATCH',
      body: { moderation_status: button.dataset.status },
    });
    window.location.reload();
  },
};

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  const handler = formHandlers[form.dataset.form];
  if (!handler) return;
  event.preventDefault();
  showFormError(form, '');
  const submitter = form.querySelector('[type="submit"]');
  if (submitter) submitter.disabled = true;
  try {
    await handler(form);
  } catch (error) {
    showFormError(form, error.message || 'Action failed');
  } finally {
    if (submitter) submitter.disabled = false;
  }
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const handler = actionHandlers[button.dataset.action];
  if (!handler) return;
  button.disabled = true;
  try {
    await handler(button);
  } catch (error) {
    notifyToast(error.message || 'Action failed');
  } finally {
    button.disabled = false;
  }
});
