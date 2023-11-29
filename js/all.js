// 共用變數
let cartsData = [];
const shoppingCartTableTbody = document.querySelector('.shoppingCart-table-tbody');
const totalPriceDom = document.querySelector('.totalPrice');

// 初始化
function init() {
  getProductList();
  getCartsList();
}
init();
// axios 獲取產品列表
function getProductList() {
  let productsData = [];
  axios.get(`${apiUrl}${apiPath}/products`)
    .then(function (response) {
      productsData = response.data.products;
      renderProductWrap(productsData);
    });
};
// axios 獲取購物車列表
function getCartsList() {
  axios.get(`${apiUrl}${apiPath}/carts`)
    .then(function (response) {
      cartsData = response.data;
      renderCartsList(cartsData);
    });
}
// 渲染 購物車列表
function renderCartsList(data) {
  const dataCarts = data.carts;
  let str = '';
  let totalPrice = 0;
  dataCarts.forEach(function (element) {
    totalPrice += element.product.price * element.quantity;
    let tr = `<tr>
            <td>
              <div class="cardItem-title">
                <img src="${element.product.images}" alt="">
                <p>${element.product.title}</p>
              </div>
            </td>
            <td>NT$${toThousands(element.product.price)}</td>
            <td>${element.quantity}</td>
            <td>NT$${toThousands(element.product.price * element.quantity)}</td>
            <td class="discardBtn" data-id="${element.id}">
              <a href="#" class="material-icons">
                clear
              </a>
            </td>
          </tr>`;
    str += tr;
  });
  shoppingCartTableTbody.innerHTML = str;
  totalPriceDom.innerHTML = `NT$${toThousands(data.finalTotal)}`;
}
// 渲染 產品列表
function renderProductWrap(data) {
  const productWrap = document.querySelector('.productWrap');
  let str = '';
  data.forEach(function (element) {
    let li = `<li class="productCard">
      <h4 class="productType">${element.category}</h4>
      <img
        src="${element.images}"
        alt="">
      <a href="#" class="addCardBtn" data-id="${element.id}">加入購物車</a>
      <h3>${element.title}</h3>
      <del class="originPrice">NT$${toThousands(element.origin_price)}</del>
      <p class="nowPrice">NT$${toThousands(element.price)}</p>
    </li>`;
    str += li;
  });
  productWrap.innerHTML = str;
};
// 篩選 產品列表
const productSelect = document.querySelector('.productSelect');
productSelect.addEventListener('change', productSelectFn);
function productSelectFn() {
  let filterData = [];
  productsData.forEach(function (element) {
    if (productSelect.value === element.category) {
      filterData.push(element);
      renderProductWrap(filterData);
    } else if (productSelect.value === '全部') {
      renderProductWrap(productsData);
    };
  });
};
// 產品加入購物車
const productWrap = document.querySelector('.productWrap');
productWrap.addEventListener('click', function (event) {
  event.preventDefault();
  const targetClass = event.target.getAttribute('class');
  // 檢查被點擊元素的class是否等於'addCardBtn'。如果不等於，就執行 return;
  if (targetClass !== 'addCardBtn') return;
  let numCheck = 1;
  let productId = event.target.dataset.id;
  // to add or update (api設計)
  cartsData.carts.forEach(function (element) {
    if (element.product.id === productId) {
      numCheck = element.quantity + 1;
    };
  });
  let postObj = {
    "data": {
      "productId": productId,
      "quantity": numCheck
    },
  };
  axios.post(`${apiUrl}${apiPath}/carts`, postObj)
    .then(function (response) {
      // 重新渲染/更新購物車
      cartsData = response.data;
      renderCartsList(cartsData);
    });
});
// 購物車表單監聽(刪除)
const shoppingCartTable = document.querySelector('.shoppingCart-table');
shoppingCartTable.addEventListener('click', function (event) {
  event.preventDefault();
  const targetClass = event.target.getAttribute('class');
  const targetParentClass = event.target.parentElement.getAttribute('class');
  if (targetClass === 'discardAllBtn') {
    axios.delete(`${apiUrl}${apiPath}/carts`)
      .then(function (response) {
        // 重新渲染/更新購物車
        cartsData = response.data;
        renderCartsList(cartsData);
      })
      .catch(function (error) {
        if (error.response.status === 400) {
          alert('購物車內已經沒有商品了喔！')
        }
      });
  } else if (targetParentClass === 'discardBtn') {
    let cartId = event.target.parentElement.dataset.id;
    axios.delete(`${apiUrl}${apiPath}/carts/${cartId}`)
      .then(function (response) {
        // 重新渲染/更新購物車
        cartsData = response.data;
        renderCartsList(cartsData);
      })
      .catch(function (error) {
        console.log(error);
      });
  };
});
// 預定資料 - 驗證與收集
// 手機 特別驗證
const customerPhone = document.querySelector('#customerPhone');
const orderInfoMessagePhone = document.querySelector('.orderInfo-message[data-message="電話"]');
customerPhone.addEventListener('blur', function () {
  if (validatePhone(customerPhone.value) === false) {
    orderInfoMessagePhone.textContent = '請輸入正確的手機格式';
    orderInfoMessagePhone.style.display = 'block';
  } else {
    orderInfoMessagePhone.style.display = 'none';
  };
});
// email 特別驗證
const customerEmail = document.querySelector('#customerEmail');
const orderInfoMessageEmail = document.querySelector('.orderInfo-message[data-message="Email"]');
customerEmail.addEventListener('blur', function () {
  if (validateEmail(customerEmail.value) === false) {
    orderInfoMessageEmail.textContent = '請輸入正確的email格式';
    orderInfoMessageEmail.style.display = 'block';
  } else {
    orderInfoMessageEmail.style.display = 'none';
  };
})
// 按下 送出預定資料 點擊事件監聽
const orderInfoBtn = document.querySelector('.orderInfo-btn');
orderInfoBtn.addEventListener('click', sentOrder);
function sentOrder(event) {
  // 如果沒有選擇產品，提醒後返回
  if (cartsData.carts.length == 0) {
    alert('請選擇至少一項產品');
    return;
  };
  // 預定資料 元素
  const orderInfoForm = document.querySelector('.orderInfo-form');
  event.preventDefault();
  const customerName = document.querySelector('#customerName');
  const customerAddress = document.querySelector('#customerAddress');
  const tradeWay = document.querySelector('#tradeWay');
  // 驗證提醒 
  const orderInfoMessageName = document.querySelector('.orderInfo-message[data-message="姓名"]');
  const orderInfoMessageAddress = document.querySelector('.orderInfo-message[data-message="寄送地址"]');
  // 使用者名稱 驗證
  if (customerName.value === '') {
    orderInfoMessageName.style.display = 'block';
  } else {
    orderInfoMessageName.style.display = 'none';
  };
  // 手機 驗證
  if (customerPhone.value === '') {
    orderInfoMessagePhone.textContent = '必填';
    orderInfoMessagePhone.style.display = 'block';
  } else {
    orderInfoMessagePhone.style.display = 'none';
  }
  // email 驗證
  if (customerEmail.value === '') {
    orderInfoMessageEmail.textContent = '必填';
    orderInfoMessageEmail.style.display = 'block';
  } else {
    orderInfoMessageEmail.style.display = 'none';
  };
  // 地址 驗證
  if (customerAddress.value === '') {
    orderInfoMessageAddress.style.display = 'block';
  } else {
    orderInfoMessageAddress.style.display = 'none';
  };
  // 付款方式 驗證
  if (tradeWay.value === '') {
    alert('請選擇交易方式！');
  };
  // 如果有其中一個沒有填寫，則返回
  if (customerName.value === '' || customerPhone.value === '' || customerEmail.value === '' || customerAddress.value === '' || tradeWay.value === '') {
    return;
  };
  // 收集預定資料
  let orderObject = {
    "data": {
      "user": {
        "name": customerName.value,
        "tel": customerPhone.value,
        "email": customerEmail.value,
        "address": customerAddress.value,
        "payment": tradeWay.value,
      },
    },
  };
  // 建立訂單
  axios.post(`${apiUrl}${apiPath}/orders`, orderObject)
    .then(function (response) {
      if (response.data.status === true) {
        orderInfoForm.reset();
        alert('訂單建立成功');
        shoppingCartTableTbody.innerHTML = '';
        totalPriceDom.innerHTML = `NT$${0}`;
      };
    })
    .catch(function (error) {
      console.log(error);
    });
};

// util 工具 JS
// 千位轉換
function toThousands(n) {
  let parts = n.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};
// email 驗證
function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  } else {
    return false;
  }
}
// 手機 驗證
function validatePhone(phone) {
  if (/^(09)[0-9]{8}$/.test(phone)) {
    return true;
  } else {
    return false;
  }
}