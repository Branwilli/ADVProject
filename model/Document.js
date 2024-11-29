class Document {
  constructor(id, name, type, category, data, uploadDate) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.category = category;
    this.data = data;
    this.uploadDate = uploadDate;
  }

  getId() {
    return this.id;
  }

  setId(id) {
    this.id = id;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }

  getType() {
    return this.type;
  }

  setType(type) {
    this.type = type;
  }

  getData() {
    return this.data;
  }

  setData(data) {
    this.data = data;
  }
  getCategory() {
    return this.category;
  }

  setCategory(category) {
    this.category = category;
  }

  getUploadDate() {
    return this.uploadDate;
  }

  setUploadDate(uploadDate) {
    this.uploadDate = uploadDate;
  }

  toString() {
    return `Document{id=${this.id}, name='${this.name}', type='${this.type}',category='${this.category}', uploadDate=${this.uploadDate}}`;
  }
}