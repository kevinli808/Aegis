from typing import Dict, List, Tuple

class SeverityRanker:
    """Ranks help requests based on a weighted scoring algorithm"""
    
    # Severity indicators mapping
    CRITICAL_CONDITIONS = {
        'bleeding', 'unconscious', 'unresponsive', 'cardiac arrest', 
        'difficulty breathing', 'severe burns', 'choking', 'poisoning'
    }
    
    CRITICAL_DISASTERS = {'fire', 'flood', 'structural collapse', 'explosion'}
    
    def calculate_severity_score(self, form_data: dict, cluster_info: dict = None, resource_data: dict = None) -> float:
        """
        Calculate overall severity score for a help request
        
        Args:
            form_data: The help request form data
            cluster_info: Info about request clustering (proximity, count, etc.)
            resource_data: Available resources and responder capabilities
        
        Returns:
            float: Overall severity score (0-100+)
        """
        severity = self._score_severity(form_data)
        immediacy = self._score_immediacy(form_data)
        vulnerability = self._score_vulnerability(form_data)
        exposure = self._score_exposure(form_data)
        confidence = self._score_confidence(form_data)
        cluster = self._score_cluster(cluster_info)
        access = self._score_access(form_data)
        resource_fit = self._score_resource_fit(form_data, resource_data)
        
        # Weighted scoring formula
        total_score = (
            30 * severity +
            15 * immediacy +
            10 * vulnerability +
            10 * exposure +
            10 * confidence +
            10 * cluster +
            10 * access +
            5 * resource_fit
        )
        
        return min(total_score, 100)  # Cap at 100
    
    def _score_severity(self, form_data: dict) -> float:
        """Score based on medical conditions and disaster type (0-10)"""
        situation = (form_data.get('situation', '') or '').lower()
        conditions = (form_data.get('medicalConditions', '') or '').lower()
        
        # Check for critical conditions
        for condition in self.CRITICAL_CONDITIONS:
            if condition in conditions or condition in situation:
                return 10.0
        
        # Check for critical disasters
        for disaster in self.CRITICAL_DISASTERS:
            if disaster in situation:
                return 10.0
        
        # Moderate severity
        if any(keyword in conditions for keyword in ['injury', 'pain', 'bleeding', 'trauma']):
            return 6.0
        
        # General situation severity
        if situation:
            return 4.0
        
        return 2.0
    
    def _score_immediacy(self, form_data: dict) -> float:
        """Score how quickly harm will escalate (0-10)"""
        immediacy_level = form_data.get('immediacy', '').lower()
        
        if immediacy_level in ['critical', 'life-threatening', 'immediate']:
            return 10.0
        elif immediacy_level in ['urgent', 'high']:
            return 7.0
        elif immediacy_level in ['moderate']:
            return 4.0
        elif immediacy_level in ['low']:
            return 1.0
        
        return 5.0  # Default to middle
    
    def _score_vulnerability(self, form_data: dict) -> float:
        """Score based on vulnerability factors (0-10)"""
        score = 0.0
        
        # Child involvement
        if form_data.get('isChild'):
            score += 6.0
        
        # Mobility limitations
        if form_data.get('hasMobilityLimitations'):
            score += 4.0
        
        # Multiple people affected
        num_people = int(form_data.get('numberOfPeople', 1))
        if num_people > 1:
            score += min(num_people, 3)  # Cap additional points at 3
        
        return min(score, 10.0)
    
    def _score_exposure(self, form_data: dict) -> float:
        """Score environmental exposure factors (0-10)"""
        hazards = (form_data.get('environmentalHazards', '') or '').lower()
        
        if not hazards or hazards == 'none reported':
            return 0.0
        
        exposure_keywords = {
            'flood': {'flood depth', 'water level', 'rising water'},
            'wildfire': {'smoke', 'flames', 'proximity'},
            'earthquake': {'structural damage', 'danger zone', 'aftershocks'},
            'chemical': {'chemical spill', 'toxic', 'gas leak'}
        }
        
        max_score = 0.0
        for hazard_type, keywords in exposure_keywords.items():
            if any(keyword in hazards for keyword in keywords):
                max_score = max(max_score, 8.0)
        
        return max_score if max_score > 0 else 5.0
    
    def _score_confidence(self, form_data: dict) -> float:
        """Score confidence in request validity (0-10)"""
        score = 0.0
        
        # Check for complete form data
        required_fields = ['name', 'phone', 'location', 'situation']
        completed_fields = sum(1 for field in required_fields if form_data.get(field))
        
        score += (completed_fields / len(required_fields)) * 6.0
        
        # Location specificity
        if form_data.get('city') and form_data.get('province'):
            score += 2.0
        
        # Contact info completeness
        if form_data.get('phone') and form_data.get('name'):
            score += 2.0
        
        return min(score, 10.0)
    
    def _score_cluster(self, cluster_info: dict = None) -> float:
        """Score based on request clustering (0-10)"""
        if not cluster_info:
            return 5.0  # Default neutral score
        
        # More requests in proximity = higher priority
        nearby_requests = cluster_info.get('nearby_count', 0)
        if nearby_requests > 5:
            return 10.0
        elif nearby_requests > 2:
            return 7.0
        elif nearby_requests > 0:
            return 5.5
        
        return 5.0
    
    def _score_access(self, form_data: dict) -> float:
        """Score difficulty for responders to reach location (0-10)"""
        access_score = 10.0  # Start with easiest access
        
        # Location accessibility
        location = (form_data.get('location', '') or '').lower()
        difficult_locations = ['remote', 'rural', 'isolated', 'mountain', 'off-road', 'building collapse']
        
        for difficult in difficult_locations:
            if difficult in location:
                access_score = min(access_score, 3.0)
                break
        
        # Mobility limitations affect exit accessibility
        if form_data.get('hasMobilityLimitations'):
            access_score = min(access_score, 5.0)
        
        return access_score
    
    def _score_resource_fit(self, form_data: dict, resource_data: dict = None) -> float:
        """Score match between incident and available resources (0-10)"""
        if not resource_data:
            return 5.0  # Default neutral score
        
        available_resources = resource_data.get('available_responders', [])
        incident_type = self._classify_incident(form_data)
        
        # Check if appropriate responders are available
        matched_resources = sum(
            1 for responder in available_resources 
            if self._responder_matches_incident(responder, incident_type)
        )
        
        if matched_resources == 0:
            return 2.0  # Poor fit
        elif matched_resources < 3:
            return 5.0
        else:
            return 9.0  # Good fit
    
    def _classify_incident(self, form_data: dict) -> str:
        """Classify the type of incident"""
        situation = (form_data.get('situation', '') or '').lower()
        
        if any(word in situation for word in ['fire', 'burn']):
            return 'fire'
        elif any(word in situation for word in ['flood', 'water', 'drowning']):
            return 'water'
        elif any(word in situation for word in ['medical', 'injury', 'bleeding', 'unconscious']):
            return 'medical'
        elif any(word in situation for word in ['earthquake', 'collapse', 'building']):
            return 'structural'
        else:
            return 'general'
    
    def _responder_matches_incident(self, responder: dict, incident_type: str) -> bool:
        """Check if responder specialty matches incident type"""
        specialty = responder.get('specialty', '').lower()
        
        matches = {
            'fire': ['fire', 'emergency'],
            'water': ['water', 'rescue', 'emergency'],
            'medical': ['medical', 'paramedic', 'ems', 'emergency'],
            'structural': ['rescue', 'structural', 'emergency'],
            'general': ['emergency', 'responder']
        }
        
        required_specialties = matches.get(incident_type, [])
        return any(spec in specialty for spec in required_specialties)


def rank_requests(requests: List[dict], cluster_info: dict = None, resource_data: dict = None) -> List[Tuple[dict, float]]:
    """
    Rank multiple help requests by severity score
    
    Args:
        requests: List of help request form data
        cluster_info: Clustering information for requests
        resource_data: Available resources
    
    Returns:
        List of tuples (request, score) sorted by score descending
    """
    ranker = SeverityRanker()
    scored_requests = []
    
    for request in requests:
        request_cluster = cluster_info.get(request.get('id')) if cluster_info else None
        score = ranker.calculate_severity_score(request, request_cluster, resource_data)
        scored_requests.append((request, score))
    
    # Sort by score descending (highest severity first)
    return sorted(scored_requests, key=lambda x: x[1], reverse=True)
