const API_BASE = '/api/v1/ai-disease';

let selectedImage = null;

function setStatusMessage(message, type = 'info') {
    const existing = document.getElementById('statusMessage');
    if (existing) existing.remove();

    const card = document.querySelector('.card');
    if (!card) return;

    const status = document.createElement('div');
    status.id = 'statusMessage';
    status.style.cssText = `
        margin-bottom: 1rem;
        padding: 0.9rem 1rem;
        border-radius: 10px;
        font-weight: 600;
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#e0f2fe'};
        color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#075985'};
    `;
    status.textContent = message;
    card.insertBefore(status, card.children[1]);
}
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        selectedImage = e.target.result;
        const preview = document.getElementById('preview');
        preview.src = selectedImage;
        preview.style.display = 'block';
        document.getElementById('analyzeBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

async function analyzeImage() {
    const cropType = document.getElementById('cropType').value;
    
    const location = document.getElementById('location').value.trim();
    if (!cropType) {
        alert('Please select a crop type');
        return;
    }

    if (!selectedImage) {
        alert('Please upload an image');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first');
        return;
    }

    document.getElementById('loadingCard').classList.remove('hidden');
    document.getElementById('resultCard').classList.add('hidden');
    document.getElementById('analyzeBtn').disabled = true;

    try {
        const imageBase64 = selectedImage.split(',')[1];
        
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64,
                crop_type: cropType
                crop_type: cropType,
                location: location || null
        });

        if (response.ok) {
            const data = await response.json();
            renderResult(data.diagnosis, data.incident_id);
        } else {
            setStatusMessage('Analysis completed successfully.', 'success');
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
            setStatusMessage(errorData.message || 'Unable to analyze image.', 'error');
    } catch (error) {
        console.error('Error analyzing image:', error);
        alert('Error analyzing image. Please try again.');
        setStatusMessage('Error analyzing image. Please try again.', 'error');
        document.getElementById('loadingCard').classList.add('hidden');
        document.getElementById('analyzeBtn').disabled = false;
    }
}

function renderResult(diagnosis, incidentId) {
    const container = document.getElementById('resultContent');
    const isHealthy = diagnosis.is_healthy || false;
    
    const resultClass = isHealthy ? 'result-healthy' : 'result-disease';
    const severityClass = `severity-${diagnosis.get('severity', 'LOW').toLowerCase()}`;
    const severityValue = (diagnosis.severity || 'LOW').toString().toLowerCase();
    const severityClass = `severity-${severityValue}`;
    const weatherRisk = diagnosis.weather_risk || 'Weather data unavailable';
    const weatherSummary = diagnosis.weather_summary || 'No local weather data supplied';
    const preventiveMeasures = Array.isArray(diagnosis.preventive_measures) ? diagnosis.preventive_measures : [];
    const fertilizers = Array.isArray(diagnosis.suggested_fertilizers) ? diagnosis.suggested_fertilizers : [];
    container.innerHTML = `
        <div class="result-card ${resultClass}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: ${isHealthy ? '#065f46' : '#991b1b'};">
                    ${isHealthy ? '<i class="fas fa-check-circle"></i> Healthy Plant' : `<i class="fas fa-exclamation-triangle"></i> ${diagnosis.disease_name || 'Unknown Disease'}`}
                </h3>
                <div style="text-align: right;">
                    <div>Confidence: ${diagnosis.confidence || 0}%</div>
                    ${!isHealthy ? `<div class="${severityClass}">${diagnosis.severity || 'UNKNOWN'}</div>` : ''}
                </div>
            </div>
            
            ${!isHealthy ? `
                <div style="margin-bottom: 1rem;">
                    <strong>Symptoms:</strong>
                    <p>${diagnosis.symptoms || 'Not specified'}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <strong>Affected Parts:</strong>
                    <p>${diagnosis.affected_parts ? diagnosis.affected_parts.join(', ') : 'Not specified'}</p>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #fef3c7; border-radius: 8px;">
                    <strong><i class="fas fa-prescription-bottle-alt"></i> Treatment:</strong>
                    <p style="margin: 0.5rem 0 0 0;">${diagnosis.treatment || 'Consult expert'}</p>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: #dbeafe; border-radius: 8px;">
                    <strong><i class="fas fa-lightbulb"></i> Recommendation:</strong>
                    <p style="margin: 0.5rem 0 0 0;">${diagnosis.recommendation || 'Monitor plant health'}</p>
                </div>
            ` : `
                <div style="padding: 1rem; background: #d1fae5; border-radius: 8px;">
                    <p style="margin: 0;"><i class="fas fa-smile"></i> Great! Your plant appears healthy. Continue regular care and monitoring.</p>
                </div>
            `}
            
            <div class="info-grid">
                <div class="info-item">
                    <label>Incident ID</label>
                    <span>${incidentId}</span>
                </div>
                <div class="info-item">
                    <label>Analysis Time</label>
                    <span>${new Date().toLocaleString()}</span>
                </div>
            </div>
            
            ${!isHealthy ? `
                <div style="margin-top: 1.5rem; padding: 1rem; background: #fff7ed; border-radius: 8px; border-left: 4px solid #f97316;">
                    <strong><i class="fas fa-user-md"></i> Need Expert Help?</strong>
                    <p style="margin: 0.5rem 0 0 0;">Contact agricultural extension services or consult with an expert for personalized treatment advice.</p>
                </div>
            ` : ''}
        </div>

            <div class="advisory-grid">
                <div class="advisory-item">
                    <h4>Organic Solution</h4>
                    <p>${diagnosis.organic_solution || 'Use crop-safe organic management practices.'}</p>
                </div>
                <div class="advisory-item">
                    <h4>Chemical Solution</h4>
                    <p>${diagnosis.chemical_solution || diagnosis.treatment || 'Consult an agronomist before spraying.'}</p>
                </div>
                <div class="advisory-item">
                    <h4>Preventive Measures</h4>
                    <p>${preventiveMeasures.length ? preventiveMeasures.join(', ') : (diagnosis.recommendation || 'Monitor the crop regularly.')}</p>
                </div>
                <div class="advisory-item">
                    <h4>Suggested Fertilizers</h4>
                    <p>${fertilizers.length ? fertilizers.join(', ') : 'Balanced NPK fertilizer'}</p>
                </div>
            </div>
    `;
    
    document.getElementById('resultCard').classList.remove('hidden');
}

document.getElementById('uploadArea').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#10b981';
    e.currentTarget.style.background = '#f0fdf4';
});

document.getElementById('uploadArea').addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.background = 'transparent';
});

document.getElementById('uploadArea').addEventListener('drop', (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.background = 'transparent';
    
    const file = e.dataTransfer.files[0];
    if (file) {
        document.getElementById('imageInput').files = e.dataTransfer.files;
        handleImageUpload({ target: { files: [file] } });
    }
});
