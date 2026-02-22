/**
 * ProgressBar component for macro tracking
 */
class ProgressBar {
  /**
   * Create a progress bar
   * @param {Object} options
   * @param {string} options.label - Label text
   * @param {number} options.current - Current value
   * @param {number} options.target - Target value
   * @param {string} options.unit - Unit suffix
   * @param {string} options.color - Custom color (optional)
   */
  constructor(options) {
    this.label = options.label
    this.current = options.current || 0
    this.target = options.target || 100
    this.unit = options.unit || ''
    this.color = options.color
  }

  getPercentage() {
    if (this.target === 0) return 0
    return Math.min((this.current / this.target) * 100, 100)
  }

  getStatusClass() {
    const percentage = (this.current / this.target) * 100
    if (percentage > 100) return 'danger'
    if (percentage > 85) return 'warning'
    return ''
  }

  render() {
    const percentage = this.getPercentage()
    const statusClass = this.getStatusClass()
    
    return `
      <div class="progress-item">
        <div class="progress-label">
          <span class="progress-label-name">${this.label}</span>
          <span class="progress-label-value">${Math.round(this.current)} / ${Math.round(this.target)}${this.unit}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
        </div>
      </div>
    `
  }
}

export default ProgressBar
