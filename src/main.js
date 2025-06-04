const appState = {
  globalVar1: 'value1',
  globalVar2: 'value2',
  globalVar3: 'value3'
};

function mainFunction() {
  const localVar1 = 'value1';
  const localVar2 = 'value2';

  function innerFunction() {
    const innerVar1 = 'value1';
    const innerVar2 = 'value2';
    // implementation
  }

  innerFunction();
}

mainFunction();